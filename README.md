# JobBridge – Job & Recruitment Platform

JobBridge is a full-stack job and recruitment platform designed to connect **students/jobseekers with recruiters**. The platform allows students to create accounts, browse available job opportunities, apply for jobs, and receive application status updates. Recruiters can register, create and manage job opportunities, view applicants, and select or reject candidates.

The system is built using modern web technologies and a microservice-oriented architecture with **React, TypeScript, Node.js, GraphQL, PostgreSQL, Kafka, and Docker**.

---

## 🚀 Key Features

### 👨‍🎓 Student / Jobseeker

* Student/jobseeker registration and login
* Secure authentication
* Create and manage profile
* Browse available job opportunities
* View job details
* Apply for jobs
* Submit resume/application details
* Track applied jobs
* Receive application status notifications
* View whether an application is selected or rejected

### 👩‍💼 Recruiter

* Recruiter registration and login
* Recruiter dashboard
* Create and publish job opportunities
* Update and manage jobs
* View applications received for each job
* Review applicant information and resumes
* Select suitable candidates
* Reject applications
* Manage posted job opportunities

### ⚙️ System Features

* Role-based authentication
* Job management
* Application management
* Student-recruiter interaction
* Application status tracking
* Notifications
* GraphQL API
* PostgreSQL database
* Kafka-based event communication
* Dockerized services
* Microservice-based architecture

---

# 🏗️ Technologies Used

## Frontend

* React.js
* TypeScript
* HTML5
* CSS3
* Vite

## Backend

* Node.js
* TypeScript
* GraphQL
* gRPC
* REST/API services

## Database

* PostgreSQL

## Message/Event Processing

* Apache Kafka
* KafkaJS

Kafka is used for event-based communication between services, such as application and notification-related events.

## Containerization

* Docker
* Docker Compose

Docker is used to run the different services of JobBridge in isolated containers and simplify project setup.

## Development Tools

* Git
* GitHub
* VS Code
* npm

---

# 🏛️ Project Architecture

JobBridge follows a service-oriented architecture where different components handle different responsibilities.

```text
                    ┌──────────────────────┐
                    │      JobBridge       │
                    │      Frontend        │
                    │   React + TypeScript │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     API Gateway      │
                    │       GraphQL        │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │     Auth     │  │ Application  │  │     Job      │
     │   Service    │  │   Service    │  │   Service    │
     └──────────────┘  └──────┬───────┘  └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │    Kafka     │
                       │ Event Broker │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ Notification │
                       │   Service    │
                       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ PostgreSQL   │
                       │   Database   │
                       └──────────────┘
```

---

# 🔄 Working Flow

## 1. Student / Jobseeker Registration

The student/jobseeker first creates an account by providing the required registration information.

```text
Student
   ↓
Register
   ↓
Account Created
   ↓
Login
```

After successful registration, the student can log in and access the student dashboard.

---

## 2. Student Login

The student enters their login credentials.

```text
Login
  ↓
Authentication
  ↓
Student Dashboard
```

After authentication, the student can browse available jobs and manage their applications.

---

## 3. Browse Job Opportunities

The student can view jobs posted by recruiters.

For each opportunity, the student can see information such as:

* Job title
* Company
* Location
* Job type
* Stipend/salary
* Description
* Required skills
* Other relevant job information

---

## 4. Apply for a Job

The student selects a suitable job and submits an application.

```text
View Job
   ↓
Apply
   ↓
Application Created
   ↓
Application Status = Applied
```

The application is stored in the system and becomes available to the recruiter.

---

# 👩‍💼 Recruiter Workflow

## 5. Recruiter Registration

A recruiter can create an account through the recruiter registration page.

```text
Recruiter
   ↓
Register
   ↓
Account Created
   ↓
Login
   ↓
Recruiter Dashboard
```

---

## 6. Recruiter Creates Job

After logging in, the recruiter can create and publish different job opportunities.

For example:

```text
Python Developer Intern
Java Developer
Frontend Developer
Full Stack Developer
Software Engineer
Data Analyst
```

The recruiter provides details such as:

* Job title
* Company
* Location
* Job type
* Salary/stipend
* Description
* Required skills
* Eligibility/details

Once published, the job becomes visible to students.

---

## 7. Recruiter Views Applicants

When students apply for a job, their applications are displayed to the recruiter.

```text
Recruiter Dashboard
        ↓
     My Jobs
        ↓
 Select Job
        ↓
    Applicants
```

The recruiter can review applicant information and application/resume details.

---

## 8. Candidate Selection / Rejection

The recruiter can make a decision for each application.

```text
             Application
                  │
          ┌───────┴───────┐
          ▼               ▼
       SELECT           REJECT
          │               │
          ▼               ▼
   Selected Status    Rejected Status
```

The application status is updated accordingly.

---

# 🔔 Notification Flow

JobBridge uses an event-driven approach for application status updates.

For example, when a recruiter selects a student:

```text
Recruiter
    ↓
Select Applicant
    ↓
Application Service
    ↓
Kafka Event
    ↓
Notification Service
    ↓
Student receives notification
```

Similarly, when an application is rejected:

```text
Recruiter
    ↓
Reject Applicant
    ↓
Application Status Updated
    ↓
Kafka Event
    ↓
Notification Service
    ↓
Student receives rejection notification
```

Kafka helps services communicate asynchronously through events.

---

# 📨 Kafka in JobBridge

Apache Kafka is used as the **event/message broker** in the system.

Instead of tightly connecting every service, an event can be published to Kafka.

Example:

```text
Application Service
       │
       │ Application Selected
       ▼
     Kafka
       │
       ▼
Notification Service
       │
       ▼
Student Notification
```

Example events may include:

* Application created
* Application selected
* Application rejected
* Job-related events
* Notification events

This approach improves communication between services and supports scalable event processing.

---

# 🐳 Docker Setup

JobBridge uses **Docker and Docker Compose** to run the application services.

Docker allows the project components to run in separate containers.

Typical services may include:

```text
Frontend
API Gateway
Auth Service
Application Service
Job Service
Notification Service
PostgreSQL
Kafka
Zookeeper / Kafka dependency
```

Docker Compose manages the services and their communication.

---

# 📋 Prerequisites

Before running JobBridge, make sure the following are installed:

* Git
* Docker Desktop
* Docker Compose
* Node.js
* npm

Check the installations:

```bash
node --version
npm --version
git --version
docker --version
docker compose version
```

---

# 📥 Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/Shital435/JobBridge.git
```

Move into the project directory:

```bash
cd JobBridge
```

---

# ⚙️ Environment Variables

Create the required `.env` files according to the configuration used by each service.

Example:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
KAFKA_BROKER=your_kafka_broker
```

**Do not upload real passwords, API keys, database credentials, or other secrets to GitHub.**

Use `.env.example` files to document the required variables without exposing sensitive information.

---

# 🐳 Run Using Docker Compose

Make sure Docker Desktop is running.

From the root JobBridge directory:

```bash
docker compose up --build
```

This builds the required Docker images and starts the services.

To run the containers in the background:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs
```

To view logs for a particular service:

```bash
docker compose logs -f service-name
```

---

# 🛑 Stop the Application

To stop the running containers:

```bash
docker compose down
```

To stop containers and remove associated volumes when required:

```bash
docker compose down -v
```

**Use `-v` carefully because it can remove database data stored in Docker volumes.**

---

# 🖥️ Running Without Docker

If you want to run individual services manually, first install their dependencies.

For a Node.js service:

```bash
npm install
```

Then start the development server using the script defined in its `package.json`, for example:

```bash
npm run dev
```

The exact commands and ports depend on the service configuration.

---

# 🗄️ Database

JobBridge uses **PostgreSQL** for storing application data.

The database can contain information related to:

* Students/jobseekers
* Recruiters
* Jobs
* Applications
* Application statuses
* User information
* Other platform data

The PostgreSQL service can be run through Docker Compose.

---

# 🔐 Authentication

JobBridge provides authentication for different types of users.

### Student / Jobseeker

```text
Register
   ↓
Login
   ↓
Student Dashboard
```

### Recruiter

```text
Register
   ↓
Login
   ↓
Recruiter Dashboard
```

Role-based access ensures that students and recruiters access the appropriate features of the platform.

---

# 📊 Application Status Flow

An application follows a simple lifecycle:

```text
Applied
   │
   ├──────────────► Selected
   │
   └──────────────► Rejected
```

### Student

The student can track the current status of their application.

### Recruiter

The recruiter can review applications and update their status.

---

# 🔁 Complete JobBridge Workflow

```text
                    JOBBRIDGE
                       │
          ┌────────────┴────────────┐
          │                         │
       STUDENT                   RECRUITER
          │                         │
       Register                  Register
          │                         │
        Login                    Login
          │                         │
          ▼                         ▼
   Student Dashboard       Recruiter Dashboard
          │                         │
          ▼                         ▼
    Browse Jobs               Create Jobs
          │                         │
          ▼                         ▼
      Apply Job              View Applicants
          │                         │
          └──────────┬──────────────┘
                     │
                     ▼
              Application
                  Status
                     │
             ┌───────┴───────┐
             ▼               ▼
          Selected         Rejected
             │               │
             └───────┬───────┘
                     ▼
                  Kafka
                     │
                     ▼
              Notification
                     │
                     ▼
                  Student
```

---

# 🧪 Testing

The system can be tested by following the complete user flow:

1. Register as a student.
2. Login as a student.
3. Browse available jobs.
4. Apply for a job.
5. Register/login as a recruiter.
6. Create a job opportunity.
7. View applications.
8. Select or reject an applicant.
9. Verify application status.
10. Verify that the student receives the appropriate notification.

---

# 🔮 Future Enhancements

Possible future improvements include:

* AI-based resume screening
* Intelligent job recommendations
* Automated candidate matching
* Interview scheduling
* Email notifications
* Real-time notifications
* Resume parsing
* Recruiter analytics dashboard
* Student placement analytics
* Advanced search and filtering
* Skill-based candidate ranking

---

# 👩‍💻 Project Purpose

JobBridge aims to simplify the recruitment process by providing a single platform where students can discover opportunities and apply for jobs while recruiters can efficiently manage job postings and applicants.

The use of **GraphQL, microservices, Kafka, PostgreSQL, and Docker** makes the project suitable for demonstrating modern full-stack and distributed application development concepts.

---

# 🛠️ Project Status

**Status:** Active Development

JobBridge is being developed as a full-stack recruitment platform with student and recruiter workflows, job management, application processing, authentication, notifications, and event-driven communication.

---

# 📄 License

This project is developed for educational and project purposes.
