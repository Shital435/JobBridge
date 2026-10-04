# JobBridge — Smart Job & Internship Portal

A working microservices MVP demonstrating:

- TypeScript + React frontend
- GraphQL API Gateway
- gRPC service-to-service communication
- Apache Kafka event streaming
- PostgreSQL persistence
- Docker + Docker Compose

## Architecture

Browser → React/TypeScript → GraphQL Gateway → User/Job/Application services

Application Service → gRPC → User Service
Application Service → Kafka → Notification Service
Application Service → Kafka → Analytics Service

## Run

Requirements:
- Docker Desktop

From the project root:

```bash
docker compose up --build
```

Open:
- Frontend: http://localhost:5173
- GraphQL API: http://localhost:4000/graphql

The database is initialized automatically.

## Demo flow

1. Open the frontend.
2. View available jobs.
3. Select a job.
4. Apply using a student ID.
5. GraphQL calls the Application Service.
6. Application Service uses gRPC to verify the student.
7. The service saves the application in PostgreSQL.
8. It publishes `application.created` to Kafka.
9. Notification and Analytics services consume the event.

## Demo student

Email: shital@example.com

The seed script creates sample students and jobs.

## Technology proof

### GraphQL
The frontend uses GraphQL queries and mutations through the API gateway.

### gRPC
Application Service calls User Service through the `GetUser` gRPC method.

### Kafka
Application Service publishes application events. Notification and Analytics services consume them.

### Docker
Every application component is containerized and started by Docker Compose.
