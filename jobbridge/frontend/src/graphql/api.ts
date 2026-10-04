import { GraphQLClient, gql } from 'graphql-request';

export const client = new GraphQLClient('/graphql');

export const JOBS = gql`
  query Jobs {
    jobs {
      id
      title
      company
      location
      type
      stipend
      description
      skills
    }
  }
`;

export const APPLY = gql`
  mutation Apply($userId: ID!, $jobId: ID!) {
    apply(userId: $userId, jobId: $jobId) {
      id
      userId
      jobId
      status
      jobTitle
      company
      location
      type
      stipend
      appliedAt
    }
  }
`;

export const CREATE_JOB = gql`
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      id
      title
      company
      location
      type
      stipend
      description
      skills
    }
  }
`;