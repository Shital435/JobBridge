```tsx
import { useEffect, useState } from 'react';
import JobCard from '../components/JobCard';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  stipend: string;
  description: string;
  skills: string;
};

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setMessage('');

        const response = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
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
            `,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `GraphQL request failed with status ${response.status}`
          );
        }

        const result = await response.json();

        console.log('==============================');
        console.log('JOBS GRAPHQL RESPONSE');
        console.log(result);
        console.log('==============================');

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }

        const fetchedJobs = result?.data?.jobs;

        if (!Array.isArray(fetchedJobs)) {
          throw new Error('Invalid jobs response from server.');
        }

        setJobs(fetchedJobs);
      } catch (error) {
        console.error('Jobs error:', error);

        setMessage(
          error instanceof Error
            ? error.message
            : 'Could not load jobs.'
        );

        setJobs([]);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  async function apply(jobId: string) {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      setMessage('Please login before applying.');
      return;
    }

    try {
      setMessage('');

      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Apply($userId: ID!, $jobId: ID!) {
              apply(userId: $userId, jobId: $jobId) {
                id
                userId
                jobId
                status
                appliedAt
              }
            }
          `,
          variables: {
            userId,
            jobId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Application request failed with status ${response.status}`
        );
      }

      const result = await response.json();

      console.log('==============================');
      console.log('APPLICATION RESPONSE');
      console.log(result);
      console.log('==============================');

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      const application = result?.data?.apply;

      if (!application) {
        throw new Error('Application response is empty.');
      }

      setMessage(
        `Application ${String(
          application.status || 'submitted'
        ).toLowerCase()} successfully. ID: ${application.id}`
      );
    } catch (error) {
      console.error('Application error:', error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Application failed.'
      );
    }
  }

  if (loading) {
    return (
      <section>
        <div className="section-title">
          <div>
            <p className="eyebrow">OPEN POSITIONS</p>
            <h2>Jobs & Internships</h2>
          </div>
        </div>

        <div className="notice">
          Loading jobs...
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="section-title">
        <div>
          <p className="eyebrow">OPEN POSITIONS</p>
          <h2>Jobs & Internships</h2>
        </div>

        <span>
          {jobs.length} {jobs.length === 1 ? 'opportunity' : 'opportunities'}
        </span>
      </div>

      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="notice">
          No jobs available.
        </div>
      ) : (
        <div className="jobs">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={apply}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```
