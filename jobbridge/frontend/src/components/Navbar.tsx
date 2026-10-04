import { useState } from 'react';

type NavbarProps = {
  activePage: string;
  setPage: (page: string) => void;
};

export default function Navbar({
  activePage,
  setPage
}: NavbarProps) {

  const [userName, setUserName] = useState(
    localStorage.getItem('userName')
  );

  function handleLogout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userSkills');

    setUserName(null);
    setPage('auth');
  }

  function handleAuth() {
    setUserName(
      localStorage.getItem('userName')
    );

    setPage('auth');
  }

  return (
    <nav className="nav">

      <div
        className="brand"
        onClick={() => setPage('jobs')}
      >
        JobBridge
      </div>

      <div className="navlinks">

        <span
          className={
            activePage === 'jobs'
              ? 'active'
              : ''
          }
          onClick={() => setPage('jobs')}
        >
          Jobs
        </span>

        <span
          className={
            activePage === 'applications'
              ? 'active'
              : ''
          }
          onClick={() => setPage('applications')}
        >
          Applications
        </span>

        <span
          className={
            activePage === 'profile'
              ? 'active'
              : ''
          }
          onClick={() => setPage('profile')}
        >
          Profile
        </span>

        {userName ? (
          <>
            <span
              className="user-name"
              onClick={() => setPage('profile')}
            >
              👤 {userName}
            </span>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            className="login-button"
            onClick={handleAuth}
          >
            Login / Register
          </button>
        )}

      </div>

    </nav>
  );
}