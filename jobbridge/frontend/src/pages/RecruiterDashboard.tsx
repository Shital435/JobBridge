import { useEffect, useState } from 'react';

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
  candidateName: string;
  candidateEmail: string;
  candidateSkills: string;
};

type RecruiterDashboardProps = {
  setPage: (page: string) => void;
};

export default function RecruiterDashboard({
  setPage
}: RecruiterDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] =
    useState(false);

  const [message, setMessage] = useState('');
  const [applicationError, setApplicationError] =
    useState('');

  const [selectedJob, setSelectedJob] =
    useState<Job | null>(null);

  const [showApplicants, setShowApplicants] =
    useState(false);

  const [updatingApplication, setUpdatingApplication] =
    useState<string | null>(null);

  const recruiterId =
    localStorage.getItem('userId');

  const recruiterName =
    localStorage.getItem('userName') ||
    'Recruiter';


  // =====================================================
  // LOAD RECRUITER JOBS
  // =====================================================

  useEffect(() => {
    async function loadJobs() {
      if (!recruiterId) {
        setMessage(
          'Recruiter ID not found. Please login again.'
        );

        setLoading(false);
        return;
      }

      const query = `
        query RecruiterJobs($recruiterId: ID!) {
          recruiterJobs(
            recruiterId: $recruiterId
          ) {
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

      try {
        setLoading(true);
        setMessage('');

        const response = await fetch('/graphql', {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            query,

            variables: {
              recruiterId
            }
          })
        });

        const result = await response.json();

        console.log(
          'Recruiter jobs:',
          result
        );

        if (!response.ok) {
          throw new Error(
            `Server error: ${response.status}`
          );
        }

        if (result.errors) {
          throw new Error(
            result.errors[0]?.message ||
              'Unable to load jobs.'
          );
        }

        setJobs(
          result.data?.recruiterJobs || []
        );

      } catch (error: any) {
        console.error(
          'Recruiter jobs error:',
          error
        );

        setMessage(
          error?.message ||
            'Unable to load your jobs.'
        );

        setJobs([]);

      } finally {
        setLoading(false);
      }
    }

    loadJobs();

  }, [recruiterId]);


  // =====================================================
  // LOAD ALL RECRUITER APPLICATIONS
  // =====================================================

  async function loadApplications() {
    if (!recruiterId) {
      setApplicationError(
        'Recruiter ID not found. Please login again.'
      );

      return;
    }

    const query = `
      query RecruiterApplications(
        $recruiterId: ID!
      ) {
        recruiterApplications(
          recruiterId: $recruiterId
        ) {
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
          candidateName
          candidateEmail
          candidateSkills
        }
      }
    `;

    try {
      setApplicationsLoading(true);
      setApplicationError('');

      const response = await fetch('/graphql', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          query,

          variables: {
            recruiterId
          }
        })
      });

      const result = await response.json();

      console.log(
        'Recruiter applications:',
        result
      );

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      if (result.errors) {
        console.error(
          'Recruiter application GraphQL error:',
          result.errors
        );

        throw new Error(
          result.errors[0]?.message ||
            'Unable to load applicants.'
        );
      }

      setApplications(
        result.data?.recruiterApplications || []
      );

    } catch (error: any) {
      console.error(
        'Recruiter applications error:',
        error
      );

      setApplicationError(
        error?.message ||
          'Unable to load applicants.'
      );

      setApplications([]);

    } finally {
      setApplicationsLoading(false);
    }
  }


  // =====================================================
  // VIEW APPLICANTS FOR A JOB
  // =====================================================

  async function handleViewApplicants(
    job: Job
  ) {
    setSelectedJob(job);
    setShowApplicants(true);

    await loadApplications();
  }


  // =====================================================
  // UPDATE APPLICATION STATUS
  // =====================================================

  async function updateApplicationStatus(
    applicationId: string,
    status: string
  ) {
    if (!recruiterId) {
      return;
    }

    try {
      setUpdatingApplication(applicationId);

      const mutation = `
        mutation UpdateApplicationStatus(
          $applicationId: ID!
          $recruiterId: ID!
          $status: String!
        ) {
          updateApplicationStatus(
            applicationId: $applicationId
            recruiterId: $recruiterId
            status: $status
          ) {
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
            candidateName
            candidateEmail
            candidateSkills
          }
        }
      `;

      const response = await fetch('/graphql', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          query: mutation,

          variables: {
            applicationId,
            recruiterId,
            status
          }
        })
      });

      const result = await response.json();

      console.log(
        'Update application:',
        result
      );

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      if (result.errors) {
        throw new Error(
          result.errors[0]?.message ||
            'Unable to update application.'
        );
      }

      const updatedApplication =
        result.data?.updateApplicationStatus;

      if (updatedApplication) {
        setApplications((current) =>
          current.map((application) =>
            application.id === applicationId
              ? {
                  ...application,
                  status:
                    updatedApplication.status
                }
              : application
          )
        );
      }

    } catch (error: any) {
      console.error(
        'Update application error:',
        error
      );

      alert(
        error?.message ||
          'Unable to update application.'
      );

    } finally {
      setUpdatingApplication(null);
    }
  }


  // =====================================================
  // CLOSE APPLICANT MODAL
  // =====================================================

  function closeApplicants() {
    setShowApplicants(false);
    setSelectedJob(null);
    setApplicationError('');
  }


  // =====================================================
  // FILTER APPLICANTS FOR SELECTED JOB
  // =====================================================

  const selectedJobApplications =
    selectedJob
      ? applications.filter(
          (application) =>
            String(application.jobId) ===
            String(selectedJob.id)
        )
      : [];


  // =====================================================
  // TOTAL APPLICANTS
  // =====================================================

  const totalApplicants =
    applications.length;


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="recruiter-dashboard">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-header">

        <div>

          <p className="dashboard-label">
            RECRUITER DASHBOARD
          </p>

          <h1>
            Welcome, {recruiterName}
          </h1>

          <p>
            Manage your job postings and find
            talented candidates.
          </p>

        </div>

        <button
          className="post-new-job-button"
          onClick={() =>
            setPage('post-job')
          }
        >
          + Post New Job
        </button>

      </div>


      {/* =================================================
          STATS
      ================================================= */}

      <div className="dashboard-stats">

        <div className="stat-card">

          <span>Jobs</span>

          <div>
            <h3>
              {jobs.length}
            </h3>

            <p>
              Jobs Posted
            </p>
          </div>

        </div>


        <div className="stat-card">

          <span>Applicants</span>

          <div>

            <h3>
              {totalApplicants}
            </h3>

            <p>
              Total Applicants
            </p>

          </div>

        </div>


        <div className="stat-card">

          <span>Active</span>

          <div>

            <h3>
              {jobs.length}
            </h3>

            <p>
              Active Jobs
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          JOBS SECTION
      ================================================= */}

      <div className="jobs-section">

        <div className="section-heading">

          <h2>
            My Job Postings
          </h2>

          <p>
            Your recently posted opportunities
          </p>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="dashboard-message">
            Loading your jobs...
          </div>
        )}


        {/* ERROR */}

        {!loading && message && (
          <div className="dashboard-error">
            {message}
          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          !message &&
          jobs.length === 0 && (

            <div className="empty-jobs">

              <div className="empty-icon">
                Jobs
              </div>

              <h3>
                No jobs posted yet
              </h3>

              <p>
                Start by creating your first
                job posting.
              </p>

              <button
                onClick={() =>
                  setPage('post-job')
                }
              >
                Post Your First Job
              </button>

            </div>
          )}


        {/* =================================================
            JOB CARDS
        ================================================= */}

        {!loading &&
          jobs.length > 0 && (

            <div className="recruiter-job-list">

              {jobs.map((job) => {

                const jobApplicants =
                  applications.filter(
                    (application) =>
                      String(
                        application.jobId
                      ) === String(job.id)
                  );

                return (

                  <div
                    className="recruiter-job-card"
                    key={job.id}
                  >

                    {/* JOB HEADER */}

                    <div className="job-card-top">

                      <div>

                        <h3>
                          {job.title}
                        </h3>

                        <p className="company-name">
                          {job.company}
                        </p>

                      </div>

                      <span className="job-status">
                        Active
                      </span>

                    </div>


                    {/* JOB DETAILS */}

                    <div className="job-details">

                      <span>
                        Location: {job.location}
                      </span>

                      <span>
                        Type: {job.type}
                      </span>

                      <span>
                        Stipend: {job.stipend}
                      </span>

                    </div>


                    {/* DESCRIPTION */}

                    <p className="job-description">
                      {job.description}
                    </p>


                    {/* SKILLS */}

                    {job.skills && (

                      <div className="skills-list">

                        {job.skills
                          .split(',')
                          .map((skill) =>
                            skill.trim()
                          )
                          .filter(
                            (skill) =>
                              skill.length > 0
                          )
                          .map((skill) => (

                            <span
                              key={skill}
                            >
                              {skill}
                            </span>

                          ))}

                      </div>

                    )}


                    {/* FOOTER */}

                    <div className="job-card-footer">

                      <span>
                        Job ID: #{job.id}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleViewApplicants(
                            job
                          )
                        }
                      >
                        View Applicants
                        {' '}
                        ({jobApplicants.length})
                      </button>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

      </div>


      {/* =================================================
          APPLICANTS MODAL
      ================================================= */}

      {showApplicants && (
        <div
          className="applicants-modal-overlay"
          onClick={closeApplicants}
        >

          <div
            className="applicants-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="applicants-modal-header">

              <div>

                <p className="dashboard-label">
                  APPLICANTS
                </p>

                <h2>
                  {selectedJob?.title}
                </h2>

                <p>
                  {selectedJob?.company}
                </p>

              </div>

              <button
                type="button"
                className="close-modal-button"
                onClick={closeApplicants}
              >
                ×
              </button>

            </div>


            {/* LOADING */}

            {applicationsLoading && (

              <div className="dashboard-message">
                Loading applicants...
              </div>

            )}


            {/* ERROR */}

            {!applicationsLoading &&
              applicationError && (

                <div className="dashboard-error">

                  {applicationError}

                </div>

              )}


            {/* NO APPLICANTS */}

            {!applicationsLoading &&
              !applicationError &&
              selectedJobApplications.length === 0 && (

                <div className="empty-jobs">

                  <div className="empty-icon">
                    👤
                  </div>

                  <h3>
                    No applicants yet
                  </h3>

                  <p>
                    Students who apply for this
                    job will appear here.
                  </p>

                </div>

              )}


            {/* APPLICANTS */}

            {!applicationsLoading &&
              !applicationError &&
              selectedJobApplications.length > 0 && (

                <div className="applicants-list">

                  <div className="applicant-count">

                    {selectedJobApplications.length}
                    {' '}
                    applicant
                    {selectedJobApplications.length !==
                    1
                      ? 's'
                      : ''}

                  </div>


                  {selectedJobApplications.map(
                    (application) => (

                      <div
                        className="applicant-card"
                        key={application.id}
                      >

                        {/* CANDIDATE */}

                        <div className="applicant-main">

                          <div className="candidate-avatar">
                            {(
                              application.candidateName ||
                              'A'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <h3>
                              {application.candidateName ||
                                'Unknown Candidate'}
                            </h3>

                            <p>
                              {application.candidateEmail ||
                                'Email not available'}
                            </p>

                          </div>

                        </div>


                        {/* SKILLS */}

                        <div className="applicant-skills">

                          <strong>
                            Skills
                          </strong>

                          <p>
                            {application.candidateSkills ||
                              'Skills not provided'}
                          </p>

                        </div>


                        {/* APPLICATION INFO */}

                        <div className="applicant-info">

                          <span>
                            Applied:{' '}
                            {application.appliedAt
                              ? new Date(
                                  application.appliedAt
                                ).toLocaleDateString()
                              : 'N/A'}
                          </span>

                          <span>
                            Application ID: #
                            {application.id}
                          </span>

                        </div>


                        {/* STATUS */}

                        <div className="applicant-actions">

                          <span
                            className={`application-status status-${application.status
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                '-'
                              )}`}
                          >
                            {application.status}
                          </span>


                          <div className="status-buttons">

                            <button
                              type="button"
                              disabled={
                                updatingApplication ===
                                application.id
                              }
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  'SHORTLISTED'
                                )
                              }
                            >
                              Shortlist
                            </button>


                            <button
                              type="button"
                              disabled={
                                updatingApplication ===
                                application.id
                              }
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  'SELECTED'
                                )
                              }
                            >
                              Select
                            </button>


                            <button
                              type="button"
                              disabled={
                                updatingApplication ===
                                application.id
                              }
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  'REJECTED'
                                )
                              }
                            >
                              Reject
                            </button>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

          </div>

        </div>
      )}

    </section>
  );
}