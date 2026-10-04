import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Kafka } from 'kafkajs';
import { Pool } from 'pg';
import path from 'path';


// ============================================================
// DATABASE
// ============================================================

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://jobbridge:jobbridge@localhost:5432/jobbridge'
});


// ============================================================
// PROTO
// ============================================================

const protoPath = path.join(
  __dirname,
  '../proto/notification.proto'
);

const packageDefinition =
  protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

const notificationProto =
  grpc.loadPackageDefinition(
    packageDefinition
  ) as any;


// ============================================================
// KAFKA
// ============================================================

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [
    process.env.KAFKA_BROKER ||
      'localhost:9092'
  ]
});

const consumer =
  kafka.consumer({
    groupId: 'notification-service'
  });


// ============================================================
// CREATE NOTIFICATION
// ============================================================

async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  applicationId: number,
  jobId: number
) {

  await pool.query(
    `
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_application_id,
      related_job_id,
      is_read
    )
    VALUES ($1, $2, $3, $4, $5, $6, FALSE)
    `,
    [
      userId,
      type,
      title,
      message,
      applicationId,
      jobId
    ]
  );

}


// ============================================================
// APPLICATION CREATED
// ============================================================

async function handleApplicationCreated(
  data: any
) {

  const applicationId =
    Number(data.applicationId);

  const userId =
    Number(data.userId);

  const jobId =
    Number(data.jobId);


  if (
    !applicationId ||
    !userId ||
    !jobId
  ) {
    console.error(
      'Invalid application.created event:',
      data
    );

    return;
  }


  try {

    // --------------------------------------------------------
    // GET JOB + RECRUITER
    // --------------------------------------------------------

    const jobResult =
      await pool.query(
        `
        SELECT
          j.title,
          j.company,
          j.recruiter_id
        FROM jobs j
        WHERE j.id = $1
        `,
        [jobId]
      );


    if (
      jobResult.rows.length === 0
    ) {

      console.error(
        `Job ${jobId} not found`
      );

      return;
    }


    const job =
      jobResult.rows[0];


    const jobTitle =
      job.title;

    const company =
      job.company;

    const recruiterId =
      Number(job.recruiter_id);


    // --------------------------------------------------------
    // NOTIFY RECRUITER
    // --------------------------------------------------------

    if (recruiterId) {

      await createNotification(
        recruiterId,
        'APPLICATION_RECEIVED',
        'New Application Received',
        `A student has applied for ${jobTitle} at ${company}.`,
        applicationId,
        jobId
      );

      console.log(
        `Recruiter ${recruiterId} notified about application ${applicationId}`
      );
    }


    // --------------------------------------------------------
    // NOTIFY STUDENT
    // --------------------------------------------------------

    await createNotification(
      userId,
      'APPLICATION_SUBMITTED',
      'Application Submitted',
      `Your application for ${jobTitle} at ${company} has been submitted successfully.`,
      applicationId,
      jobId
    );


    console.log(
      `Student ${userId} notified about application ${applicationId}`
    );

  } catch (error) {

    console.error(
      'Error handling application.created:',
      error
    );

  }

}


// ============================================================
// APPLICATION STATUS UPDATED
// ============================================================

async function handleApplicationStatusUpdated(
  data: any
) {

  const applicationId =
    Number(data.applicationId);

  const userId =
    Number(data.userId);

  const jobId =
    Number(data.jobId);

  const status =
    String(data.status || '')
      .toUpperCase();


  if (
    !applicationId ||
    !userId ||
    !jobId ||
    !status
  ) {

    console.error(
      'Invalid application.status.updated event:',
      data
    );

    return;
  }


  try {

    // --------------------------------------------------------
    // GET JOB
    // --------------------------------------------------------

    const jobResult =
      await pool.query(
        `
        SELECT
          title,
          company
        FROM jobs
        WHERE id = $1
        `,
        [jobId]
      );


    const job =
      jobResult.rows[0];


    const jobTitle =
      job?.title ||
      'the job';


    const company =
      job?.company ||
      'the company';


    // --------------------------------------------------------
    // PREPARE MESSAGE
    // --------------------------------------------------------

    let title =
      'Application Status Updated';

    let message =
      `Your application for ${jobTitle} at ${company} has been updated.`;


    if (status === 'SHORTLISTED') {

      title =
        'You Have Been Shortlisted!';

      message =
        `Congratulations! You have been shortlisted for ${jobTitle} at ${company}.`;

    }


    else if (status === 'SELECTED') {

      title =
        'You Have Been Selected!';

      message =
        `Congratulations! You have been selected for ${jobTitle} at ${company}.`;

    }


    else if (status === 'REJECTED') {

      title =
        'Application Update';

      message =
        `Your application for ${jobTitle} at ${company} was not selected. Keep applying and best of luck!`;

    }


    // --------------------------------------------------------
    // SAVE STUDENT NOTIFICATION
    // --------------------------------------------------------

    await createNotification(
      userId,
      `APPLICATION_${status}`,
      title,
      message,
      applicationId,
      jobId
    );


    console.log(
      `Student ${userId} notified: ${status}`
    );

  } catch (error) {

    console.error(
      'Error handling application.status.updated:',
      error
    );

  }

}


// ============================================================
// START KAFKA CONSUMER
// ============================================================

async function startKafkaConsumer() {

  try {

    await consumer.connect();

    console.log(
      'Kafka notification consumer connected'
    );


    await consumer.subscribe({
      topic: 'application.created',
      fromBeginning: false
    });


    await consumer.subscribe({
      topic: 'application.status.updated',
      fromBeginning: false
    });


    await consumer.run({

      eachMessage: async ({
        topic,
        message
      }) => {

        try {

          if (!message.value) {
            return;
          }


          const data =
            JSON.parse(
              message.value.toString()
            );


          console.log(
            `Kafka event received: ${topic}`,
            data
          );


          if (
            topic ===
            'application.created'
          ) {

            await handleApplicationCreated(
              data
            );

          }


          else if (
            topic ===
            'application.status.updated'
          ) {

            await handleApplicationStatusUpdated(
              data
            );

          }

        } catch (error) {

          console.error(
            'Kafka message processing error:',
            error
          );

        }

      }

    });

  } catch (error) {

    console.error(
      'Kafka consumer error:',
      error
    );

  }

}


// ============================================================
// GET NOTIFICATIONS
// ============================================================

async function getNotifications(
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
          id,
          user_id,
          type,
          title,
          message,
          related_application_id,
          related_job_id,
          is_read,
          created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
      );


    const notifications =
      result.rows.map(
        (row) => ({
          id: Number(row.id),

          userId:
            Number(row.user_id),

          type:
            row.type,

          title:
            row.title,

          message:
            row.message,

          relatedApplicationId:
            row.related_application_id
              ? Number(
                  row.related_application_id
                )
              : 0,

          relatedJobId:
            row.related_job_id
              ? Number(
                  row.related_job_id
                )
              : 0,

          isRead:
            Boolean(row.is_read),

          createdAt:
            row.created_at
              ? new Date(
                  row.created_at
                ).toISOString()
              : ''
        })
      );


    callback(
      null,
      {
        notifications
      }
    );

  } catch (error) {

    console.error(
      'Get notifications error:',
      error
    );

    callback(
      error
    );

  }

}


// ============================================================
// MARK ONE NOTIFICATION READ
// ============================================================

async function markNotificationRead(
  call: any,
  callback: any
) {

  try {

    const id =
      Number(call.request.id);

    const userId =
      Number(call.request.userId);


    const result =
      await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1
          AND user_id = $2
        RETURNING
          id,
          user_id,
          type,
          title,
          message,
          related_application_id,
          related_job_id,
          is_read,
          created_at
        `,
        [
          id,
          userId
        ]
      );


    if (
      result.rows.length === 0
    ) {

      callback(
        {
          code:
            grpc.status.NOT_FOUND,

          message:
            'Notification not found'
        }
      );

      return;
    }


    const row =
      result.rows[0];


    callback(
      null,
      {
        id:
          Number(row.id),

        userId:
          Number(row.user_id),

        type:
          row.type,

        title:
          row.title,

        message:
          row.message,

        relatedApplicationId:
          row.related_application_id
            ? Number(
                row.related_application_id
              )
            : 0,

        relatedJobId:
          row.related_job_id
            ? Number(
                row.related_job_id
              )
            : 0,

        isRead:
          Boolean(row.is_read),

        createdAt:
          row.created_at
            ? new Date(
                row.created_at
              ).toISOString()
            : ''
      }
    );

  } catch (error) {

    console.error(
      'Mark notification read error:',
      error
    );

    callback(
      error
    );

  }

}


// ============================================================
// MARK ALL NOTIFICATIONS READ
// ============================================================

async function markAllNotificationsRead(
  call: any,
  callback: any
) {

  try {

    const userId =
      Number(call.request.userId);


    await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      `,
      [userId]
    );


    const result =
      await pool.query(
        `
        SELECT
          id,
          user_id,
          type,
          title,
          message,
          related_application_id,
          related_job_id,
          is_read,
          created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
      );


    const notifications =
      result.rows.map(
        (row) => ({
          id:
            Number(row.id),

          userId:
            Number(row.user_id),

          type:
            row.type,

          title:
            row.title,

          message:
            row.message,

          relatedApplicationId:
            row.related_application_id
              ? Number(
                  row.related_application_id
                )
              : 0,

          relatedJobId:
            row.related_job_id
              ? Number(
                  row.related_job_id
                )
              : 0,

          isRead:
            Boolean(row.is_read),

          createdAt:
            row.created_at
              ? new Date(
                  row.created_at
                ).toISOString()
              : ''
        })
      );


    callback(
      null,
      {
        notifications
      }
    );

  } catch (error) {

    console.error(
      'Mark all notifications read error:',
      error
    );

    callback(
      error
    );

  }

}


// ============================================================
// START GRPC SERVER
// ============================================================

async function startGrpcServer() {

  const server =
    new grpc.Server();


  server.addService(
    notificationProto
      .notification
      .NotificationService
      .service,
    {
      GetNotifications:
        getNotifications,

      MarkNotificationRead:
        markNotificationRead,

      MarkAllNotificationsRead:
        markAllNotificationsRead
    }
  );


  const port =
    process.env.PORT ||
    '50054';


  server.bindAsync(
    `0.0.0.0:${port}`,

    grpc.ServerCredentials.createInsecure(),

    (error) => {

      if (error) {

        console.error(
          'Notification gRPC server error:',
          error
        );

        process.exit(1);

      }


      console.log(
        `Notification Service running on port ${port}`
      );

    }
  );

}


// ============================================================
// START SERVICE
// ============================================================

async function start() {

  try {

    await pool.query(
      'SELECT 1'
    );

    console.log(
      'Notification database connected'
    );


    await startKafkaConsumer();


    await startGrpcServer();

  } catch (error) {

    console.error(
      'Notification service startup error:',
      error
    );

    process.exit(1);

  }

}


start();