```tsx
type HomeProps = {
  setPage?: (page: string) => void;
};

export default function Home({ setPage }: HomeProps) {
  return (
    <section className="home-page">

      {/* Hero Section */}
      <div className="hero">
        <p className="eyebrow">STUDENT CAREER PLATFORM</p>

        <h1>
          Find opportunities.
          <br />
          <span>Build your future.</span>
        </h1>

        <p className="hero-text">
          Discover jobs and internships, apply with ease, and take the next
          step toward your career.
        </p>

        <div className="hero-buttons">
          <button
            className="primary-btn"
            onClick={() => setPage?.('jobs')}
          >
            Explore Opportunities
          </button>

          <button
            className="secondary-btn"
            onClick={() => setPage?.('applications')}
          >
            View My Applications
          </button>
        </div>
      </div>


      {/* Features */}
      <div className="features">

        <div className="feature-card">
          <div className="feature-icon">💼</div>

          <h3>Find Jobs</h3>

          <p>
            Explore job opportunities from companies looking for fresh talent.
          </p>
        </div>


        <div className="feature-card">
          <div className="feature-icon">🎓</div>

          <h3>Internships</h3>

          <p>
            Discover internships that help you gain real-world experience.
          </p>
        </div>


        <div className="feature-card">
          <div className="feature-icon">📄</div>

          <h3>Easy Applications</h3>

          <p>
            Apply to opportunities and track your applications in one place.
          </p>
        </div>

      </div>


      {/* How It Works */}
      <div className="how-it-works">

        <div className="how-content">

          <p className="eyebrow">HOW IT WORKS</p>

          <h2>Your career journey starts here.</h2>

          <p>
            Create your profile, discover suitable opportunities, apply to
            companies, and track your progress from one simple platform.
          </p>

        </div>


        <div className="steps">

          <div className="step">
            <span>01</span>

            <div>
              <h3>Create Your Profile</h3>

              <p>
                Add your skills, education, resume and career details.
              </p>
            </div>
          </div>


          <div className="step">
            <span>02</span>

            <div>
              <h3>Discover Opportunities</h3>

              <p>
                Find jobs and internships that match your interests.
              </p>
            </div>
          </div>


          <div className="step">
            <span>03</span>

            <div>
              <h3>Apply & Track</h3>

              <p>
                Submit applications and monitor your application status.
              </p>
            </div>
          </div>

        </div>

      </div>


      {/* Bottom CTA */}
      <div className="cta">

        <h2>Ready to start your career journey?</h2>

        <p>
          Explore opportunities and take your next step toward your dream
          career.
        </p>

        <button
          className="primary-btn"
          onClick={() => setPage?.('jobs')}
        >
          Explore Jobs
        </button>

      </div>

    </section>
  );
}
```
