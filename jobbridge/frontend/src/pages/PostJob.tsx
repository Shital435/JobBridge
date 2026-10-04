import { useState } from 'react';

type PostJobProps = {
  setPage: (page: string) => void;
};

export default function PostJob({
  setPage
}: PostJobProps) {

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Internship');
  const [stipend, setStipend] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(
    event: React.FormEvent
  ) {

    event.preventDefault();

    const recruiterId =
      localStorage.getItem('userId');

    const recruiterRole =
      localStorage.getItem('userRole');

    if (!recruiterId) {
      setMessage(
        'Please login as a recruiter first.'
      );
      return;
    }

    if (recruiterRole !== 'RECRUITER') {
      setMessage(
        'Only recruiters can post jobs.'
      );
      return;
    }

    setLoading(true);
    setMessage('');

    const mutation = `
      mutation CreateJob(
        $input: CreateJobInput!
      ) {
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

    const variables = {
      input: {
        recruiterId,
        title,
        company,
        location,
        type,
        stipend,
        description,
        skills
      }
    };

    try {

      const response = await fetch(
        '/graphql',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            query: mutation,
            variables
          })
        }
      );

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          result.errors[0].message
        );
      }

      setMessage(
        'Job posted successfully!'
      );

      setTitle('');
      setCompany('');
      setLocation('');
      setType('Internship');
      setStipend('');
      setDescription('');
      setSkills('');

      setTimeout(() => {
        setPage('recruiter-dashboard');
      }, 1000);

    } catch (error: any) {

      setMessage(
        error.message ||
        'Failed to post job.'
      );

    } finally {

      setLoading(false);
    }
  }

  return (
    <section className="post-job-page">

      <div className="post-job-card">

        <div className="post-job-header">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              setPage('recruiter-dashboard')
            }
          >
            Back
          </button>

          <h2>
            Post a New Job
          </h2>

          <p>
            Find the right candidate for your company.
          </p>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="form-row">

            <div className="form-group">

              <label>
                Job Title
              </label>

              <input
                type="text"
                placeholder="Python Developer Intern"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
              />

            </div>


            <div className="form-group">

              <label>
                Company
              </label>

              <input
                type="text"
                placeholder="JobBridge Technologies"
                value={company}
                onChange={(e) =>
                  setCompany(e.target.value)
                }
                required
              />

            </div>

          </div>


          <div className="form-row">

            <div className="form-group">

              <label>
                Location
              </label>

              <input
                type="text"
                placeholder="Pune"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                required
              />

            </div>


            <div className="form-group">

              <label>
                Job Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value)
                }
              >

                <option value="Internship">
                  Internship
                </option>

                <option value="Full-time">
                  Full-time
                </option>

                <option value="Part-time">
                  Part-time
                </option>

                <option value="Contract">
                  Contract
                </option>

              </select>

            </div>

          </div>


          <div className="form-group">

            <label>
              Salary / Stipend
            </label>

            <input
              type="text"
              placeholder="15000/month or 5 LPA"
              value={stipend}
              onChange={(e) =>
                setStipend(e.target.value)
              }
              required
            />

          </div>


          <div className="form-group">

            <label>
              Required Skills
            </label>

            <input
              type="text"
              placeholder="Python, Django, SQL, Git"
              value={skills}
              onChange={(e) =>
                setSkills(e.target.value)
              }
              required
            />

          </div>


          <div className="form-group">

            <label>
              Job Description
            </label>

            <textarea
              placeholder="Describe the job role, responsibilities and requirements..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={6}
              required
            />

          </div>


          <button
            type="submit"
            className="post-job-button"
            disabled={loading}
          >
            {loading
              ? 'Posting Job...'
              : 'Post Job'}
          </button>

        </form>


        {message && (
          <p className="post-job-message">
            {message}
          </p>
        )}

      </div>

    </section>
  );
}