import { useEffect, useState } from 'react';

type Application = {
  id: string;
  userId: string;
  jobId: string;
  status: string;
  jobTitle: string;
  company: string;
  location: string;
  type: string;
  stipend: string;
  appliedAt: string;
};

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      setLoading(false);
      setError('Please login to view your applications.');
      return;
    }

    async function loadApplications() {
      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `
              query MyApplications($userId: ID!) {
                myApplications(userId: $userId) {
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
            `,
            variables: {
              userId
            }
          })
        });

        const result = await response.json();

        console.log('Applications response:', result);

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        setApplications(
          result.data.myApplications || []
        );

      } catch (error: any) {
        console.error('Applications error:', error);
        setError(
          error?.message ||
          'Unable to load applications.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  if (loading) {
    return (
      <section className="page">
        <h2>My Applications</h2>
        <p>Loading applications...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <h2>My Applications</h2>
        <div className="notice">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>My Applications</h2>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>No applications yet</h3>
          <p>
            Apply to a job and your application
            will appear here.
          </p>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((application) => (
            <div
              className="application-card"
              key={application.id}
            >
              <div>
                <h3>
                  {application.jobTitle ||
                    `Job #${application.jobId}`}
                </h3>

                <p>
                  <strong>Company:</strong>{' '}
                  {application.company || 'N/A'}
                </p>

                <p>
                  <strong>Location:</strong>{' '}
                  {application.location || 'N/A'}
                </p>

                <p>
                  <strong>Type:</strong>{' '}
                  {application.type || 'N/A'}
                </p>

                <p>
                  <strong>Stipend:</strong>{' '}
                  {application.stipend || 'N/A'}
                </p>

                <p>
                  <strong>Applied:</strong>{' '}
                  {application.appliedAt
                    ? new Date(
                        application.appliedAt
                      ).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>

              <div className="application-status">
                {application.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}