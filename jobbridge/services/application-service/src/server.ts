import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Pool } from 'pg';
import { Kafka } from 'kafkajs';
import path from 'path';

// ============================================
// DATABASE
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ============================================
// USER SERVICE CLIENT
// ============================================

const userDef = protoLoader.loadSync(
  path.join(__dirname, '../proto/user.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const userPkg = grpc.loadPackageDefinition(
  userDef
) as any;

const userClient = new userPkg.user.UserService(
  process.env.USER_SERVICE_HOST || 'user-service:50051',
  grpc.credentials.createInsecure()
);

// ============================================
// KAFKA
// ============================================

const kafka = new Kafka({
  clientId: 'application-service',
  brokers: [
    process.env.KAFKA_BROKER || 'kafka:9092'
  ]
});

const producer = kafka.producer();

// ============================================
// VERIFY USER
// ============================================

async function verifyUser(id: number): Promise<any> {
  return new Promise((resolve, reject) => {
    userClient.GetUser(
      { id },
      (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }
    );
  });
}

// ============================================
// SEND KAFKA MESSAGE
// ============================================

async function sendKafkaMessage(
  topic: string,
  key: string,
  value: any
) {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(value)
        }
      ]
    });

    console.log(
      `Kafka message sent to ${topic}`
    );
  } catch (error: any) {
    console.error(
      'Kafka message failed:',
      error?.message || error
    );
  }
}

// ============================================
// START APPLICATION SERVICE
// ============================================

async function start() {

  // ==========================================
  // CONNECT KAFKA
  // ==========================================

  try {
    await producer.connect();

    console.log(
      'Kafka producer connected'
    );
  } catch (error: any) {
    console.error(
      'Kafka connection failed. Continuing without Kafka:',
      error?.message || error
    );
  }

  // ==========================================
  // GRPC SERVER
  // ==========================================

  const server = new grpc.Server();

  // ==========================================
  // APPLICATION PROTO
  // ==========================================

  const applicationDef =
    protoLoader.loadSync(
      path.join(
        __dirname,
        '../proto/application.proto'
      ),
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      }
    );

  const applicationPkg =
    grpc.loadPackageDefinition(
      applicationDef
    ) as any;

  // ==========================================
  // APPLICATION SERVICE
  // ==========================================

  server.addService(
    applicationPkg.application
      .ApplicationService.service,

    {

      // ======================================
      // CREATE APPLICATION
      // ======================================

      CreateApplication: async (
        call: any,
        callback: any
      ) => {

        try {

          const userId = Number(
            call.request.userId
          );

          const jobId = Number(
            call.request.jobId
          );

          // -------------------------------
          // Verify student/user
          // -------------------------------

          const user = await verifyUser(
            userId
          );

          if (!user) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'User not found'
            });
          }

          // -------------------------------
          // Check job exists
          // -------------------------------

          const jobResult =
            await pool.query(
              `
              SELECT
                id,
                title,
                company,
                recruiter_id
              FROM jobs
              WHERE id = $1
              `,
              [jobId]
            );

          if (jobResult.rows.length === 0) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Job not found'
            });
          }

          // -------------------------------
          // Insert application
          // -------------------------------

          const result =
            await pool.query(
              `
              INSERT INTO applications(
                user_id,
                job_id,
                status
              )
              VALUES($1, $2, 'APPLIED')

              ON CONFLICT(user_id, job_id)
              DO UPDATE SET
                status = 'APPLIED'

              RETURNING
                id,
                user_id,
                job_id,
                status,
                created_at
              `,
              [
                userId,
                jobId
              ]
            );

          const app = result.rows[0];

          // -------------------------------
          // Kafka event
          // -------------------------------

          await sendKafkaMessage(
            'application.created',
            String(app.id),
            {
              applicationId: app.id,
              userId: app.user_id,
              jobId: app.job_id,
              status: app.status
            }
          );

          // -------------------------------
          // Response
          // -------------------------------

          callback(
            null,
            {
              id: app.id,
              userId: app.user_id,
              jobId: app.job_id,
              status: app.status,
              appliedAt: app.created_at
                ? new Date(
                    app.created_at
                  ).toISOString()
                : ''
            }
          );

        } catch (error: any) {

          console.error(
            'CreateApplication error:',
            error
          );

          callback({
            code: grpc.status.INTERNAL,
            message:
              error?.message ||
              'Application failed'
          });
        }
      },

      // ======================================
      // GET MY APPLICATIONS
      // ======================================

      GetMyApplications: async (
        call: any,
        callback: any
      ) => {

        try {

          const userId = Number(
            call.request.userId
          );

          await verifyUser(
            userId
          );

          const result =
            await pool.query(
              `
              SELECT
                a.id,
                a.user_id,
                a.job_id,
                a.status,
                a.created_at,

                j.title AS job_title,
                j.company,
                j.location,
                j.type,
                j.stipend,

                u.name AS candidate_name,
                u.email AS candidate_email,
                u.skills AS candidate_skills,
                u.cgpa::text AS candidate_cgpa,
                u.resume_url AS candidate_resume_url

              FROM applications a

              INNER JOIN jobs j
                ON a.job_id = j.id

              INNER JOIN users u
                ON a.user_id = u.id

              WHERE a.user_id = $1

              ORDER BY a.created_at DESC
              `,
              [userId]
            );

          const applications =
            result.rows.map(
              (app: any) => ({

                id: app.id,

                userId:
                  app.user_id,

                jobId:
                  app.job_id,

                status:
                  app.status,

                jobTitle:
                  app.job_title || '',

                company:
                  app.company || '',

                location:
                  app.location || '',

                type:
                  app.type || '',

                stipend:
                  app.stipend || '',

                appliedAt:
                  app.created_at
                    ? new Date(
                        app.created_at
                      ).toISOString()
                    : '',

                candidateName:
                  app.candidate_name || '',

                candidateEmail:
                  app.candidate_email || '',

                candidateSkills:
                  app.candidate_skills || '',

                candidateCgpa:
                  app.candidate_cgpa || '0',

                candidateResumeUrl:
                  app.candidate_resume_url || ''
              })
            );

          callback(
            null,
            {
              applications
            }
          );

        } catch (error: any) {

          console.error(
            'GetMyApplications error:',
            error
          );

          callback({
            code: grpc.status.INTERNAL,
            message:
              error?.message ||
              'Could not fetch applications'
          });
        }
      },

      // ======================================
      // GET RECRUITER APPLICATIONS
      // ======================================

      GetRecruiterApplications: async (
        call: any,
        callback: any
      ) => {

        try {

          const recruiterId = Number(
            call.request.recruiterId
          );

          console.log(
            'Getting applications for recruiter:',
            recruiterId
          );

          // -------------------------------
          // Verify recruiter
          // -------------------------------

          const recruiter =
            await verifyUser(
              recruiterId
            );

          if (
            !recruiter ||
            String(recruiter.role)
              .toUpperCase() !==
              'RECRUITER'
          ) {
            return callback({
              code:
                grpc.status.PERMISSION_DENIED,
              message:
                'User is not a recruiter'
            });
          }

          // -------------------------------
          // Fetch applications
          // -------------------------------

          const result =
            await pool.query(
              `
              SELECT
                a.id,
                a.user_id,
                a.job_id,
                a.status,
                a.created_at,

                j.title AS job_title,
                j.company,
                j.location,
                j.type,
                j.stipend,

                u.name AS candidate_name,
                u.email AS candidate_email,
                u.skills AS candidate_skills,
                u.cgpa::text AS candidate_cgpa,
                u.resume_url AS candidate_resume_url

              FROM applications a

              INNER JOIN jobs j
                ON a.job_id = j.id

              INNER JOIN users u
                ON a.user_id = u.id

              WHERE j.recruiter_id = $1

              ORDER BY a.created_at DESC
              `,
              [recruiterId]
            );

          console.log(
            'Recruiter applications found:',
            result.rows.length
          );

          const applications =
            result.rows.map(
              (app: any) => ({

                id:
                  app.id,

                userId:
                  app.user_id,

                jobId:
                  app.job_id,

                status:
                  app.status,

                jobTitle:
                  app.job_title || '',

                company:
                  app.company || '',

                location:
                  app.location || '',

                type:
                  app.type || '',

                stipend:
                  app.stipend || '',

                appliedAt:
                  app.created_at
                    ? new Date(
                        app.created_at
                      ).toISOString()
                    : '',

                candidateName:
                  app.candidate_name || '',

                candidateEmail:
                  app.candidate_email || '',

                candidateSkills:
                  app.candidate_skills || '',

                candidateCgpa:
                  app.candidate_cgpa || '0',

                candidateResumeUrl:
                  app.candidate_resume_url || ''
              })
            );

          callback(
            null,
            {
              applications
            }
          );

        } catch (error: any) {

          console.error(
            'GetRecruiterApplications error:',
            error
          );

          callback({
            code: grpc.status.INTERNAL,
            message:
              error?.message ||
              'Could not fetch recruiter applications'
          });
        }
      },

      // ======================================
      // UPDATE APPLICATION STATUS
      // ======================================

      UpdateApplicationStatus: async (
        call: any,
        callback: any
      ) => {

        try {

          const applicationId =
            Number(
              call.request.applicationId
            );

          const recruiterId =
            Number(
              call.request.recruiterId
            );

          const status =
            String(
              call.request.status
            ).toUpperCase();

          // -------------------------------
          // Allowed statuses
          // -------------------------------

          const allowedStatuses = [
            'APPLIED',
            'SHORTLISTED',
            'REJECTED',
            'SELECTED'
          ];

          if (
            !allowedStatuses.includes(
              status
            )
          ) {
            return callback({
              code:
                grpc.status.INVALID_ARGUMENT,
              message:
                'Invalid application status'
            });
          }

          // -------------------------------
          // Verify recruiter
          // -------------------------------

          const recruiter =
            await verifyUser(
              recruiterId
            );

          if (
            !recruiter ||
            String(recruiter.role)
              .toUpperCase() !==
              'RECRUITER'
          ) {
            return callback({
              code:
                grpc.status.PERMISSION_DENIED,
              message:
                'User is not a recruiter'
            });
          }

          // -------------------------------
          // Update only recruiter's job
          // -------------------------------

          const result =
            await pool.query(
              `
              UPDATE applications a

              SET status = $1

              FROM jobs j

              WHERE a.id = $2
                AND a.job_id = j.id
                AND j.recruiter_id = $3

              RETURNING
                a.id,
                a.user_id,
                a.job_id,
                a.status,
                a.created_at
              `,
              [
                status,
                applicationId,
                recruiterId
              ]
            );

          if (
            result.rows.length === 0
          ) {
            return callback({
              code:
                grpc.status.NOT_FOUND,
              message:
                'Application not found or you do not own this job'
            });
          }

          const app =
            result.rows[0];

          // -------------------------------
          // Send status notification
          // -------------------------------

          await sendKafkaMessage(
            'application.status.updated',
            String(app.id),
            {
              applicationId:
                app.id,

              userId:
                app.user_id,

              jobId:
                app.job_id,

              status:
                app.status
            }
          );

          // -------------------------------
          // Response
          // -------------------------------

          callback(
            null,
            {
              id:
                app.id,

              userId:
                app.user_id,

              jobId:
                app.job_id,

              status:
                app.status,

              appliedAt:
                app.created_at
                  ? new Date(
                      app.created_at
                    ).toISOString()
                  : ''
            }
          );

        } catch (error: any) {

          console.error(
            'UpdateApplicationStatus error:',
            error
          );

          callback({
            code: grpc.status.INTERNAL,
            message:
              error?.message ||
              'Could not update application'
          });
        }
      }
    }
  );

  // ==========================================
  // START GRPC SERVER
  // ==========================================

  const port =
    Number(
      process.env.PORT ||
      50053
    );

  server.bindAsync(
    `0.0.0.0:${port}`,

    grpc.ServerCredentials
      .createInsecure(),

    (
      error: any,
      boundPort: number
    ) => {

      if (error) {

        console.error(
          'Failed to start Application Service:',
          error
        );

        process.exit(1);
      }

      console.log(
        `Application Service gRPC running on ${boundPort}`
      );
    }
  );
}

// ============================================
// START APPLICATION
// ============================================

start().catch(
  (error) => {

    console.error(
      'Application Service startup error:',
      error
    );

    process.exit(1);
  }
);