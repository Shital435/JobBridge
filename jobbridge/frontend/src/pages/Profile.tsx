import { useEffect, useState } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string;
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      setMessage('Please login to view your profile.');
      setLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `
              query GetUser($id: ID!) {
                user(id: $id) {
                  id
                  name
                  email
                  role
                  skills
                }
              }
            `,
            variables: {
              id: userId
            }
          })
        });

        const result = await response.json();

        console.log('Profile response:', result);

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const profile = result.data.user;

        if (!profile) {
          throw new Error('User not found.');
        }

        setUser(profile);
        setName(profile.name);
        setSkills(profile.skills || '');

        localStorage.setItem('userName', profile.name);
        localStorage.setItem('userEmail', profile.email);
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userSkills', profile.skills || '');

      } catch (error: any) {
        console.error('Profile error:', error);
        setMessage(
          error?.message || 'Unable to load profile.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function updateProfile() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      setMessage('Please login first.');
      return;
    }

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            mutation UpdateProfile(
              $id: ID!
              $name: String!
              $skills: String!
            ) {
              updateProfile(
                id: $id
                name: $name
                skills: $skills
              ) {
                id
                name
                email
                role
                skills
              }
            }
          `,
          variables: {
            id: userId,
            name,
            skills
          }
        })
      });

      const result = await response.json();

      console.log('Update profile response:', result);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const updatedUser = result.data.updateProfile;

      setUser(updatedUser);

      localStorage.setItem(
        'userName',
        updatedUser.name
      );

      localStorage.setItem(
        'userSkills',
        updatedUser.skills || ''
      );

      setMessage('Profile updated successfully.');

    } catch (error: any) {
      console.error('Profile update error:', error);

      setMessage(
        error?.message || 'Profile update failed.'
      );
    }
  }

  if (loading) {
    return (
      <section className="page">
        <h2>My Profile</h2>
        <p>Loading profile...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page">
        <h2>My Profile</h2>
        <div className="notice">
          {message || 'Profile not available.'}
        </div>
      </section>
    );
  }

  return (
    <section className="page">

      <h2>My Profile</h2>

      <p>
        Welcome to your JobBridge profile,
        <strong> {user.name}</strong>.
      </p>

      <div className="profile-card">

        <div className="profile-avatar">
          👤
        </div>

        <div className="profile-details">

          <h3>{user.name}</h3>

          <p>
            <strong>Email:</strong>{' '}
            {user.email}
          </p>

          <p>
            <strong>Role:</strong>{' '}
            {user.role}
          </p>

          <label>Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <label>Skills</label>

          <input
            type="text"
            value={skills}
            placeholder="Python, SQL, Java"
            onChange={(e) =>
              setSkills(e.target.value)
            }
          />

          <button
            type="button"
            onClick={updateProfile}
          >
            Save Changes
          </button>

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}

        </div>

      </div>

    </section>
  );
}