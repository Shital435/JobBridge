import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';


// ============================================================
// PROTO FILES
// ============================================================

const userProtoPath = path.join(
  __dirname,
  '../proto/user.proto'
);

const jobProtoPath = path.join(
  __dirname,
  '../proto/job.proto'
);

const applicationProtoPath = path.join(
  __dirname,
  '../proto/application.proto'
);

const notificationProtoPath = path.join(
  __dirname,
  '../proto/notification.proto'
);


// ============================================================
// LOAD USER PROTO
// ============================================================

const userPackageDefinition =
  protoLoader.loadSync(userProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

const userProto = grpc.loadPackageDefinition(
  userPackageDefinition
) as any;


// ============================================================
// LOAD JOB PROTO
// ============================================================

const jobPackageDefinition =
  protoLoader.loadSync(jobProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

const jobProto = grpc.loadPackageDefinition(
  jobPackageDefinition
) as any;


// ============================================================
// LOAD APPLICATION PROTO
// ============================================================

const applicationPackageDefinition =
  protoLoader.loadSync(applicationProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

const applicationProto = grpc.loadPackageDefinition(
  applicationPackageDefinition
) as any;


// ============================================================
// LOAD NOTIFICATION PROTO
// ============================================================

const notificationPackageDefinition =
  protoLoader.loadSync(notificationProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

const notificationProto = grpc.loadPackageDefinition(
  notificationPackageDefinition
) as any;


// ============================================================
// GRPC CLIENTS
// ============================================================

const userServiceUrl =
  process.env.USER_SERVICE_URL ||
  'localhost:50051';

const jobServiceUrl =
  process.env.JOB_SERVICE_URL ||
  'localhost:50052';

const applicationServiceUrl =
  process.env.APPLICATION_SERVICE_URL ||
  'localhost:50053';

const notificationServiceUrl =
  process.env.NOTIFICATION_SERVICE_URL ||
  'localhost:50054';


const userClient =
  new userProto.user.UserService(
    userServiceUrl,
    grpc.credentials.createInsecure()
  );


const jobClient =
  new jobProto.job.JobService(
    jobServiceUrl,
    grpc.credentials.createInsecure()
  );


const applicationClient =
  new applicationProto.application.ApplicationService(
    applicationServiceUrl,
    grpc.credentials.createInsecure()
  );


const notificationClient =
  new notificationProto.notification.NotificationService(
    notificationServiceUrl,
    grpc.credentials.createInsecure()
  );


// ============================================================
// GRAPHQL SCHEMA
// ============================================================

const typeDefs = `#graphql

  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    skills: String!
    cgpa: String
    resumeUrl: String
  }


  type Job {
    id: ID!
    title: String!
    company: String!
    location: String!
    type: String!
    stipend: String!
    description: String!
    skills: String!
    recruiterId: ID
    createdAt: String
  }


  type Application {
    id: ID!
    userId: ID!
    jobId: ID!
    status: String!

    jobTitle: String
    company: String
    location: String
    type: String
    stipend: String
    appliedAt: String

    candidateName: String
    candidateEmail: String
    candidateSkills: String
    candidateCgpa: String
    candidateResumeUrl: String
  }


  type Notification {
    id: ID!
    userId: ID!
    type: String!
    title: String!
    message: String!

    relatedApplicationId: ID
    relatedJobId: ID

    isRead: Boolean!
    createdAt: String!
  }


  input CreateJobInput {
    title: String!
    company: String!
    location: String!
    type: String!
    stipend: String!
    description: String!
    skills: String!
    recruiterId: ID
  }


  type Query {

    user(id: ID!): User

    job(id: ID!): Job

    jobs: [Job!]!

    myApplications(
      userId: ID!
    ): [Application!]!

    recruiterApplications(
      recruiterId: ID!
    ): [Application!]!

    recruiterJobs(
      recruiterId: ID!
    ): [Job!]!

    notifications(
      userId: ID!
    ): [Notification!]!
  }


  type Mutation {

    register(
      name: String!
      email: String!
      password: String!
      role: String
      skills: String
    ): User!


    login(
      email: String!
      password: String!
    ): User!


    updateProfile(
      id: ID!
      name: String!
      skills: String!
      cgpa: String
      resumeUrl: String
    ): User!


    apply(
      userId: ID!
      jobId: ID!
    ): Application!


    createJob(
      input: CreateJobInput!
    ): Job!


    updateApplicationStatus(
      applicationId: ID!
      recruiterId: ID!
      status: String!
    ): Application!


    markNotificationRead(
      id: ID!
      userId: ID!
    ): Notification!


    markAllNotificationsRead(
      userId: ID!
    ): [Notification!]!
  }
`;


// ============================================================
// HELPER
// ============================================================

function parseId(value: string): number {
  const id = Number(value);

  if (!Number.isInteger(id)) {
    throw new Error(`Invalid ID: ${value}`);
  }

  return id;
}


// ============================================================
// GRAPHQL RESOLVERS
// ============================================================

const resolvers = {

  // ==========================================================
  // QUERIES
  // ==========================================================

  Query: {

    // --------------------------------------------------------
    // GET USER
    // --------------------------------------------------------

    user: async (
      _: any,
      args: { id: string }
    ) => {

      return new Promise((resolve, reject) => {

        userClient.GetUser(
          {
            id: parseId(args.id)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // GET SINGLE JOB
    // --------------------------------------------------------

    job: async (
      _: any,
      args: { id: string }
    ) => {

      return new Promise((resolve, reject) => {

        jobClient.GetJob(
          {
            id: parseId(args.id)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // GET ALL JOBS
    // --------------------------------------------------------

    jobs: async () => {

      return new Promise((resolve, reject) => {

        jobClient.GetJobs(
          {},

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(
              response?.jobs || []
            );
          }
        );

      });

    },


    // --------------------------------------------------------
    // STUDENT APPLICATIONS
    // --------------------------------------------------------

    myApplications: async (
      _: any,
      args: { userId: string }
    ) => {

      return new Promise((resolve, reject) => {

        applicationClient.GetMyApplications(
          {
            userId: parseId(args.userId)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(
              response?.applications || []
            );
          }
        );

      });

    },


    // --------------------------------------------------------
    // RECRUITER APPLICATIONS
    // --------------------------------------------------------

    recruiterApplications: async (
      _: any,
      args: { recruiterId: string }
    ) => {

      return new Promise((resolve, reject) => {

        applicationClient.GetRecruiterApplications(
          {
            recruiterId: parseId(args.recruiterId)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(
              response?.applications || []
            );
          }
        );

      });

    },


    // --------------------------------------------------------
    // RECRUITER JOBS
    // --------------------------------------------------------

    recruiterJobs: async (
      _: any,
      args: { recruiterId: string }
    ) => {

      return new Promise((resolve, reject) => {

        jobClient.GetRecruiterJobs(
          {
            recruiterId: parseId(args.recruiterId)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(
              response?.jobs || []
            );
          }
        );

      });

    },


    // --------------------------------------------------------
    // NOTIFICATIONS
    // --------------------------------------------------------

    notifications: async (
      _: any,
      args: { userId: string }
    ) => {

      return new Promise((resolve, reject) => {

        notificationClient.GetNotifications(
          {
            userId: parseId(args.userId)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(
              response?.notifications || []
            );
          }
        );

      });

    }

  },


  // ==========================================================
  // MUTATIONS
  // ==========================================================

  Mutation: {

    // --------------------------------------------------------
    // REGISTER
    // --------------------------------------------------------

    register: async (
      _: any,
      args: {
        name: string;
        email: string;
        password: string;
        role?: string;
        skills?: string;
      }
    ) => {

      return new Promise((resolve, reject) => {

        userClient.Register(
          {
            name: args.name,
            email: args.email,
            password: args.password,
            role: args.role || 'STUDENT',
            skills: args.skills || ''
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // LOGIN
    // --------------------------------------------------------

    login: async (
      _: any,
      args: {
        email: string;
        password: string;
      }
    ) => {

      return new Promise((resolve, reject) => {

        userClient.Login(
          {
            email: args.email,
            password: args.password
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // UPDATE PROFILE
    // --------------------------------------------------------

    updateProfile: async (
      _: any,
      args: {
        id: string;
        name: string;
        skills: string;
        cgpa?: string;
        resumeUrl?: string;
      }
    ) => {

      return new Promise((resolve, reject) => {

        userClient.UpdateProfile(
          {
            id: parseId(args.id),
            name: args.name,
            skills: args.skills,
            cgpa: args.cgpa || '0',
            resumeUrl: args.resumeUrl || ''
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // APPLY FOR JOB
    // --------------------------------------------------------

    apply: async (
      _: any,
      args: {
        userId: string;
        jobId: string;
      }
    ) => {

      return new Promise((resolve, reject) => {

        applicationClient.CreateApplication(
          {
            userId: parseId(args.userId),
            jobId: parseId(args.jobId)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // CREATE JOB
    // --------------------------------------------------------

    createJob: async (
      _: any,
      args: {
        input: {
          title: string;
          company: string;
          location: string;
          type: string;
          stipend: string;
          description: string;
          skills: string;
          recruiterId?: string;
        };
      }
    ) => {

      return new Promise((resolve, reject) => {

        jobClient.CreateJob(
          {
            title: args.input.title,
            company: args.input.company,
            location: args.input.location,
            type: args.input.type,
            stipend: args.input.stipend,
            description: args.input.description,
            skills: args.input.skills,
            recruiterId: args.input.recruiterId
              ? parseId(args.input.recruiterId)
              : 0
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // UPDATE APPLICATION STATUS
    // --------------------------------------------------------

    updateApplicationStatus: async (
      _: any,
      args: {
        applicationId: string;
        recruiterId: string;
        status: string;
      }
    ) => {

      return new Promise((resolve, reject) => {

        applicationClient.UpdateApplicationStatus(
          {
            applicationId:
              parseId(args.applicationId),

            recruiterId:
              parseId(args.recruiterId),

            status: args.status
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // MARK NOTIFICATION READ
    // --------------------------------------------------------

    markNotificationRead: async (
      _: any,
      args: {
        id: string;
        userId: string;
      }
    ) => {

      return new Promise((resolve, reject) => {

        notificationClient.MarkNotificationRead(
          {
            id: parseId(args.id),
            userId: parseId(args.userId)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(response);
          }
        );

      });

    },


    // --------------------------------------------------------
    // MARK ALL NOTIFICATIONS READ
    // --------------------------------------------------------

    markAllNotificationsRead: async (
      _: any,
      args: {
        userId: string;
      }
    ) => {

      return new Promise((resolve, reject) => {

        notificationClient.MarkAllNotificationsRead(
          {
            userId: parseId(args.userId)
          },

          (error: any, response: any) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(
              response?.notifications || []
            );
          }
        );

      });

    }

  }

};


// ============================================================
// EXPRESS + APOLLO SERVER
// ============================================================

async function startServer() {

  const app = express();

  const httpServer =
    http.createServer(app);


  const apolloServer =
    new ApolloServer({
      typeDefs,
      resolvers,

      plugins: [
        ApolloServerPluginDrainHttpServer({
          httpServer
        })
      ]
    });


  await apolloServer.start();


  app.use(
    cors()
  );


  app.use(
    express.json()
  );


  app.use(
    '/graphql',
    expressMiddleware(
      apolloServer
    )
  );


  const PORT =
    Number(process.env.PORT || 4000);


  httpServer.listen(
    PORT,
    () => {

      console.log(
        `🚀 GraphQL Gateway running on http://localhost:${PORT}/graphql`
      );

    }
  );

}


startServer().catch(
  (error) => {

    console.error(
      'Failed to start GraphQL Gateway:',
      error
    );

    process.exit(1);

  }
);