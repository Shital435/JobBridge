```tsx
import { useState } from 'react';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import RecruiterDashboard from './pages/RecruiterDashboard';
import PostJob from './pages/PostJob';

import './styles.css';

export default function App() {
  const userRole = localStorage.getItem('userRole');

  const [activePage, setActivePage] = useState(
    userRole === 'RECRUITER'
      ? 'recruiter-dashboard'
      : 'jobs'
  );

  return (
    <>
      {/* Navigation */}
      <Navbar
        activePage={activePage}
        setPage={setActivePage}
      />

      {/* Main Content */}
      <main>

        {/* Authentication */}
        {activePage === 'auth' && (
          <Auth
            setPage={setActivePage}
          />
        )}


        {/* Student Jobs Page */}
        {activePage === 'jobs' && (
          <>
            <Home
              setPage={setActivePage}
            />

            <Jobs />
          </>
        )}


        {/* Applications */}
        {activePage === 'applications' && (
          <Applications />
        )}


        {/* Student Profile */}
        {activePage === 'profile' && (
          <Profile />
        )}


        {/* Recruiter Dashboard */}
        {activePage === 'recruiter-dashboard' && (
          <RecruiterDashboard
            setPage={setActivePage}
          />
        )}


        {/* Recruiter Post Job */}
        {activePage === 'post-job' && (
          <PostJob
            setPage={setActivePage}
          />
        )}

      </main>


      {/* Footer */}
      <footer>
        JobBridge - Built with TypeScript, GraphQL, gRPC, Kafka & Docker
      </footer>
    </>
  );
}
```
