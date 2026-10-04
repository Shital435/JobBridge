-- ============================================================
-- JOBBRIDGE DATABASE INITIALIZATION
-- ============================================================


-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'STUDENT',
  skills TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  cgpa NUMERIC(4,2) DEFAULT 0,
  resume_url TEXT DEFAULT ''
);


-- ============================================================
-- JOBS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  location VARCHAR(120) NOT NULL,
  type VARCHAR(40) NOT NULL,
  stipend VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  skills TEXT NOT NULL DEFAULT '',
  recruiter_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- APPLICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  job_id INTEGER REFERENCES jobs(id),
  status VARCHAR(40) NOT NULL DEFAULT 'APPLIED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, job_id)
);


-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,

  user_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,

  title VARCHAR(200) NOT NULL,

  message TEXT NOT NULL,

  related_application_id INTEGER,

  related_job_id INTEGER,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, is_read);


-- ============================================================
-- DEFAULT STUDENT
-- ============================================================

INSERT INTO users (
  name,
  email,
  role,
  skills,
  password_hash,
  cgpa,
  resume_url
)
VALUES (
  'Shital Mhaske',
  'shital@example.com',
  'STUDENT',
  'Python, Java, SQL, TypeScript',
  '',
  0,
  ''
)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- DEFAULT JOB 1
-- ============================================================

INSERT INTO jobs (
  title,
  company,
  location,
  type,
  stipend,
  description,
  skills
)
SELECT
  'Software Engineering Intern',
  'Dezinet',
  'Remote',
  'Internship',
  'Up to ₹15,000/month',
  'Build production software with a modern TypeScript and microservices stack.',
  'TypeScript, GraphQL, Docker, gRPC'
WHERE NOT EXISTS (
  SELECT 1
  FROM jobs
  WHERE title = 'Software Engineering Intern'
);


-- ============================================================
-- DEFAULT JOB 2
-- ============================================================

INSERT INTO jobs (
  title,
  company,
  location,
  type,
  stipend,
  description,
  skills
)
SELECT
  'Backend Developer Intern',
  'TechNova',
  'Pune',
  'Internship',
  '₹12,000/month',
  'Work on APIs, distributed services and event-driven applications.',
  'Node.js, PostgreSQL, Kafka'
WHERE NOT EXISTS (
  SELECT 1
  FROM jobs
  WHERE title = 'Backend Developer Intern'
);


-- ============================================================
-- DEFAULT JOB 3
-- ============================================================

INSERT INTO jobs (
  title,
  company,
  location,
  type,
  stipend,
  description,
  skills
)
SELECT
  'Junior Software Engineer',
  'CloudWorks',
  'Bengaluru',
  'Full-time',
  '₹5 LPA',
  'Develop scalable backend and frontend features with a collaborative engineering team.',
  'TypeScript, React, SQL'
WHERE NOT EXISTS (
  SELECT 1
  FROM jobs
  WHERE title = 'Junior Software Engineer'
);