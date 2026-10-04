import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Pool } from 'pg';
import path from 'path';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

const protoPath = path.join(
  __dirname,
  '../proto/user.proto'
);

const def = protoLoader.loadSync(
  protoPath,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const pkg = grpc.loadPackageDefinition(
  def
) as any;

const server = new grpc.Server();

server.addService(
  pkg.user.UserService.service,
  {

    GetUser: async (
      call: any,
      callback: any
    ) => {

      try {

        const result =
          await pool.query(
            `
            SELECT
              id,
              name,
              email,
              role,
              skills,
              cgpa::text AS cgpa,
              resume_url AS "resumeUrl"
            FROM users
            WHERE id = $1
            `,
            [call.request.id]
          );

        if (!result.rows[0]) {
          return callback({
            code: grpc.status.NOT_FOUND,
            message: 'User not found'
          });
        }

        callback(
          null,
          result.rows[0]
        );

      } catch (error) {

        console.error(error);

        callback({
          code: grpc.status.INTERNAL,
          message: 'Database error'
        });
      }
    },


    Register: async (
      call: any,
      callback: any
    ) => {

      try {

        const {
          name,
          email,
          password,
          role,
          skills
        } = call.request;

        if (
          !name ||
          !email ||
          !password
        ) {
          return callback({
            code:
              grpc.status.INVALID_ARGUMENT,
            message:
              'Name, email and password are required'
          });
        }

        const passwordHash =
          hashPassword(password);

        const result =
          await pool.query(
            `
            INSERT INTO users
              (
                name,
                email,
                role,
                skills,
                password_hash,
                cgpa,
                resume_url
              )
            VALUES
              ($1, $2, $3, $4, $5, 0, '')
            RETURNING
              id,
              name,
              email,
              role,
              skills,
              cgpa::text AS cgpa,
              resume_url AS "resumeUrl"
            `,
            [
              name,
              email,
              role || 'STUDENT',
              skills || '',
              passwordHash
            ]
          );

        callback(
          null,
          result.rows[0]
        );

      } catch (error: any) {

        console.error(error);

        if (error.code === '23505') {

          return callback({
            code:
              grpc.status.ALREADY_EXISTS,
            message:
              'Email already registered'
          });
        }

        callback({
          code:
            grpc.status.INTERNAL,
          message:
            'Registration failed'
        });
      }
    },


    Login: async (
      call: any,
      callback: any
    ) => {

      try {

        const {
          email,
          password
        } = call.request;

        const result =
          await pool.query(
            `
            SELECT
              id,
              name,
              email,
              role,
              skills,
              password_hash,
              cgpa::text AS cgpa,
              resume_url AS "resumeUrl"
            FROM users
            WHERE email = $1
            `,
            [email]
          );

        if (!result.rows[0]) {

          return callback({
            code:
              grpc.status.UNAUTHENTICATED,
            message:
              'Invalid email or password'
          });
        }

        const user =
          result.rows[0];

        const passwordHash =
          hashPassword(password);

        if (
          user.password_hash !==
          passwordHash
        ) {

          return callback({
            code:
              grpc.status.UNAUTHENTICATED,
            message:
              'Invalid email or password'
          });
        }

        callback(
          null,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            skills: user.skills,
            cgpa: user.cgpa || '0',
            resumeUrl:
              user.resumeUrl || ''
          }
        );

      } catch (error) {

        console.error(error);

        callback({
          code:
            grpc.status.INTERNAL,
          message:
            'Login failed'
        });
      }
    },


    UpdateProfile: async (
      call: any,
      callback: any
    ) => {

      try {

        const {
          id,
          name,
          skills,
          cgpa,
          resumeUrl
        } = call.request;

        const numericCgpa =
          Number(cgpa || 0);

        if (
          Number.isNaN(numericCgpa) ||
          numericCgpa < 0 ||
          numericCgpa > 10
        ) {

          return callback({
            code:
              grpc.status.INVALID_ARGUMENT,
            message:
              'CGPA must be between 0 and 10'
          });
        }

        const result =
          await pool.query(
            `
            UPDATE users
            SET
              name = $1,
              skills = $2,
              cgpa = $3,
              resume_url = $4
            WHERE id = $5
            RETURNING
              id,
              name,
              email,
              role,
              skills,
              cgpa::text AS cgpa,
              resume_url AS "resumeUrl"
            `,
            [
              name,
              skills || '',
              numericCgpa,
              resumeUrl || '',
              id
            ]
          );

        if (!result.rows[0]) {

          return callback({
            code:
              grpc.status.NOT_FOUND,
            message:
              'User not found'
          });
        }

        callback(
          null,
          result.rows[0]
        );

      } catch (error) {

        console.error(error);

        callback({
          code:
            grpc.status.INTERNAL,
          message:
            'Profile update failed'
        });
      }
    }

  }
);

const port =
  Number(
    process.env.PORT || 50051
  );

server.bindAsync(
  `0.0.0.0:${port}`,
  grpc.ServerCredentials.createInsecure(),
  () => {

    console.log(
      `User Service gRPC running on ${port}`
    );
  }
);