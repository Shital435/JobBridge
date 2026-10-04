import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Pool } from 'pg';
import path from 'path';
import { Kafka } from 'kafkajs';


// =====================================================
// DATABASE
// =====================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});


// =====================================================
// KAFKA
// =====================================================

const kafka = new Kafka({
  clientId: 'application-service',
  brokers: [
    process.env.KAFKA_BROKER || 'kafka:9092'
  ]
});

const producer = kafka.producer();


// =====================================================
// USER SERVICE CLIENT
// =====================================================

const userProtoPath = path.join(
  __dirname,
  '../proto/user.proto'
);

const userProtoDefinition =
  protoLoader.loadSync(
    userProtoPath,
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    }
  );

const userPackage =
  grpc.loadPackageDefinition(
    userProtoDefinition
  ) as any;

const userClient =
  new userPackage.user.UserService(
    process.env.USER_SERVICE_HOST ||
      'user-service:50051',
    grpc.credentials.createInsecure()
  );


// =====================================================
// APPLICATION SERVICE PROTO
// =====================================================

const applicationProtoPath =
  path.join(
    __dirname,
    '../proto/application.proto'
  );

const applicationProtoDefinition =
  protoLoader.loadSync(
    applicationProtoPath,
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    }
  );

const applicationPackage =
  grpc.loadPackageDefinition(
    applicationProtoDefinition
  ) as any;


// =====================================================
// HELPER - CALL USER SERVICE
// =====================================================

function getUser(
  userId: number
): Promise<any> {

  return new Promise(
    (resolve, reject) => {

      userClient.GetUser(
        {
          id: userId
        },
        (
          error: any,
          response: any
        ) => {

          if (error) {
            reject(error);
            return;
          }

          resolve(response);
        }
      );

    }
  );
}


// =====================================================
// CREATE APPLICATION
// =====================================================

async function createApplication(
  call: any,
  callback: any
) {

  try {

    const userId =
      Number(call.request.userId);

    const jobId =
      Number(call.request.jobId);


    if (!userId || !jobId) {

      return callback({
        code:
          grpc.status.INVALID_ARGUMENT,
        message:
          'userId and jobId are required'
      });

    }


    // -------------------------------------------------
    // VERIFY USER
    // -------------------------------------------------

    let user;

    try {

      user =
        await getUser(userId);

    } catch (error) {

      console.error(
        'User service error:',
        error
      );

      return callback({
        code:
          grpc.status.NOT_FOUND,
        message:
          'User not found'
      });

    }


    // -------------------------------------------------
    // VERIFY JOB
    // -------------------------------------------------

    const jobResult =
      await pool.query(
        `
        SELECT
          id,
          title,
          company,
          location,
          type,
          stipend
        FROM jobs
        WHERE id = $1
        `,
        [jobId]
      );


    if (!jobResult.rows[0]) {

      return callback({
        code:
          grpc.status.NOT_FOUND,
        message:
          'Job not found'
      });

    }


    // -------------------------------------------------
    // CREATE / REACTIVATE APPLICATION
    // -------------------------------------------------

    const result =
      await pool.query(
        `
        INSERT INTO applications (
          user_id,
          job_id,
          status
        )
        VALUES (
          $1,
          $2,
          'APPLIED'
        )
        ON CONFLICT (
          user_id,
          job_id
        )
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


    const application =
      result.rows[0];

    const job =
      jobResult.rows[0];


    // -------------------------------------------------
    // SEND KAFKA EVENT
    // -------------------------------------------------

    try {

      await producer.send({
        topic:
          'application.created',

        messages: [
          {
            key:
              String(application.id),

            value:
              JSON.stringify({
                applicationId:
                  application.id,

                userId:
                  application.user_id,

                jobId:
                  application.job_id,

                status:
                  application.status
              })
          }
        ]
      });

    } catch (kafkaError) {

      console.error(
        'Kafka application.created error:',
        kafkaError
      );

      // Do not fail the application
      // if Kafka is temporarily unavailable.
    }


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    callback(
      null,
      {
        id:
          application.id,

        userId:
          application.user_id,

        jobId:
          application.job_id,

        status:
          application.status,

        jobTitle:
          job.title,

        company:
          job.company,

        location:
          job.location,

        type:
          job.type,

        stipend:
          job.stipend,

        appliedAt:
          application.created_at
            ?.toISOString?.() ||
          String(
            application.created_at
          ),

        candidateName:
          user.name || '',

        candidateEmail:
          user.email || '',

        candidateSkills:
          user.skills || '',

        candidateCgpa:
          user.cgpa || '0',

        candidateResumeUrl:
          user.resumeUrl || ''
      }
    );

  } catch (error) {

    console.error(
      'CreateApplication error:',
      error
    );

    callback({
      code:
        grpc.status.INTERNAL,
      message:
        'Unable to create application'
    });

  }
}


// =====================================================
// GET MY APPLICATIONS
// =====================================================

async function getMyApplications(
  call: any,
  callback: any
) {

  try {

    const userId =
      Number(call.request.userId);


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

        JOIN jobs j
          ON j.id = a.job_id

        JOIN users u
          ON u.id = a.user_id

        WHERE a.user_id = $1

        ORDER BY
          a.created_at DESC
        `,
        [userId]
      );


    callback(
      null,
      {
        applications:
          result.rows.map(
            (row: any) => ({

              id:
                row.id,

              userId:
                row.user_id,

              jobId:
                row.job_id,

              status:
                row.status,

              jobTitle:
                row.job_title,

              company:
                row.company,

              location:
                row.location,

              type:
                row.type,

              stipend:
                row.stipend,

              appliedAt:
                row.created_at
                  ?.toISOString?.() ||
                String(
                  row.created_at
                ),

              candidateName:
                row.candidate_name || '',

              candidateEmail:
                row.candidate_email || '',

              candidateSkills:
                row.candidate_skills || '',

              candidateCgpa:
                row.candidate_cgpa || '0',

              candidateResumeUrl:
                row.candidate_resume_url || ''

            })
          )
      }
    );

  } catch (error) {

    console.error(
      'GetMyApplications error:',
      error
    );

    callback({
      code:
        grpc.status.INTERNAL,
      message:
        'Unable to load applications'
    });

  }
}


// =====================================================
// GET RECRUITER APPLICATIONS
// =====================================================

async function getRecruiterApplications(
  call: any,
  callback: any
) {

  try {

    const recruiterId =
      Number(
        call.request.recruiterId
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

        JOIN jobs j
          ON j.id = a.job_id

        JOIN users u
          ON u.id = a.user_id

        WHERE j.recruiter_id = $1

        ORDER BY
          a.created_at DESC
        `,
        [recruiterId]
      );


    callback(
      null,
      {
        applications:
          result.rows.map(
            (row: any) => ({

              id:
                row.id,

              userId:
                row.user_id,

              jobId:
                row.job_id,

              status:
                row.status,

              jobTitle:
                row.job_title,

              company:
                row.company,

              location:
                row.location,

              type:
                row.type,

              stipend:
                row.stipend,

              appliedAt:
                row.created_at
                  ?.toISOString?.() ||
                String(
                  row.created_at
                ),

              candidateName:
                row.candidate_name || '',

              candidateEmail:
                row.candidate_email || '',

              candidateSkills:
                row.candidate_skills || '',

              candidateCgpa:
                row.candidate_cgpa || '0',

              candidateResumeUrl:
                row.candidate_resume_url || ''

            })
          )
      }
    );

  } catch (error) {

    console.error(
      'GetRecruiterApplications error:',
      error
    );

    callback({
      code:
        grpc.status.INTERNAL,
      message:
        'Unable to load recruiter applications'
    });

  }
}


// =====================================================
// UPDATE APPLICATION STATUS
// =====================================================

async function updateApplicationStatus(
  call: any,
  callback: any
) {

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


    // -------------------------------------------------
    // VALID STATUS
    // -------------------------------------------------

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


    // -------------------------------------------------
    // FIND APPLICATION + VERIFY RECRUITER
    // -------------------------------------------------

    const existingResult =
      await pool.query(
        `
        SELECT
          a.id,
          a.user_id,
          a.job_id,

          j.recruiter_id,
          j.title,
          j.company,
          j.location,
          j.type,
          j.stipend

        FROM applications a

        JOIN jobs j
          ON j.id = a.job_id

        WHERE
          a.id = $1
          AND j.recruiter_id = $2
        `,
        [
          applicationId,
          recruiterId
        ]
      );


    if (!existingResult.rows[0]) {

      return callback({
        code:
          grpc.status.NOT_FOUND,
        message:
          'Application not found or recruiter is not authorized'
      });

    }


    const existing =
      existingResult.rows[0];


    // -------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------

    const result =
      await pool.query(
        `
        UPDATE applications

        SET status = $1

        WHERE id = $2

        RETURNING
          id,
          user_id,
          job_id,
          status,
          created_at
        `,
        [
          status,
          applicationId
        ]
      );


    const application =
      result.rows[0];


    // -------------------------------------------------
    // GET CANDIDATE DETAILS
    // -------------------------------------------------

    const candidateResult =
      await pool.query(
        `
        SELECT
          name,
          email,
          skills,
          cgpa::text AS cgpa,
          resume_url
        FROM users
        WHERE id = $1
        `,
        [
          existing.user_id
        ]
      );


    const candidate =
      candidateResult.rows[0] ||
      {};


    // -------------------------------------------------
    // SEND KAFKA STATUS EVENT
    // -------------------------------------------------

    try {

      await producer.send({
        topic:
          'application.status.updated',

        messages: [
          {
            key:
              String(
                application.id
              ),

            value:
              JSON.stringify({

                applicationId:
                  application.id,

                userId:
                  application.user_id,

                jobId:
                  application.job_id,

                status:
                  application.status

              })
          }
        ]
      });

    } catch (kafkaError) {

      console.error(
        'Kafka status update error:',
        kafkaError
      );

      // Database update has already
      // succeeded, so do not fail it
      // because of Kafka.
    }


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    callback(
      null,
      {

        id:
          application.id,

        userId:
          application.user_id,

        jobId:
          application.job_id,

        status:
          application.status,

        jobTitle:
          existing.title,

        company:
          existing.company,

        location:
          existing.location,

        type:
          existing.type,

        stipend:
          existing.stipend,

        appliedAt:
          application.created_at
            ?.toISOString?.() ||
          String(
            application.created_at
          ),

        candidateName:
          candidate.name || '',

        candidateEmail:
          candidate.email || '',

        candidateSkills:
          candidate.skills || '',

        candidateCgpa:
          candidate.cgpa || '0',

        candidateResumeUrl:
          candidate.resume_url || ''

      }
    );

  } catch (error) {

    console.error(
      'UpdateApplicationStatus error:',
      error
    );

    callback({
      code:
        grpc.status.INTERNAL,
      message:
        'Unable to update application status'
    });

  }
}


// =====================================================
// START SERVER
// =====================================================

async function main() {

  try {

    await producer.connect();

    console.log(
      'Application Service Kafka producer connected'
    );

    const server =
      new grpc.Server();


    server.addService(
      applicationPackage
        .application
        .ApplicationService
        .service,
      {

        CreateApplication:
          createApplication,

        GetMyApplications:
          getMyApplications,

        GetRecruiterApplications:
          getRecruiterApplications,

        UpdateApplicationStatus:
          updateApplicationStatus

      }
    );


    const port =
      Number(
        process.env.PORT || 50053
      );


    server.bindAsync(
      `0.0.0.0:${port}`,

      grpc.ServerCredentials.createInsecure(),

      (error) => {

        if (error) {

          console.error(
            'Application Service bind error:',
            error
          );

          return;
        }

        console.log(
          `Application Service gRPC running on ${port}`
        );
      }
    );

  } catch (error) {

    console.error(
      'Application Service startup error:',
      error
    );

    process.exit(1);
  }
}


main();