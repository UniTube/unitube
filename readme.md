# Web Engineering Project

A full-stack web application with Go backend and TypeScript/React frontend.

---

## Backend

### Overview

The backend is a RESTful API built with **Go** and **Gin** framework, following a clean architecture pattern. It uses **PostgreSQL** as the database and provides automatic API documentation via **Swagger**.

### Backend Construction

The backend follows a **layered architecture** pattern with clear separation of concerns:

```
backend/
├── main.go                 # Application entry point
├── config/                 # Configuration & database connection
├── controllers/            # HTTP request handlers
├── services/               # Business logic layer
├── repositories/           # Data access layer
├── models/                 # Database models
├── dtos/                   # Data Transfer Objects (request/response)
├── routes/                 # Route definitions
├── docs/                   # Swagger documentation (auto-generated)
├── docker-compose.yml      # Docker services orchestration
└── Dockerfile             # Container configuration
```

### Backend Architecture

The backend follows a **4-layer clean architecture**:

```
HTTP Requests
     ↓
┌─────────────────────────┐
│   CONTROLLERS Layer      │  (HTTP handlers, request validation)
│  - user.controller.go    │
│  - video.controller.go   │
└────────────┬─────────────┘
             ↓
┌─────────────────────────┐
│   SERVICES Layer        │  (Business logic, workflows)
│  - user.service.go      │
│  - video.service.go     │
└────────────┬─────────────┘
             ↓
┌─────────────────────────┐
│  REPOSITORIES Layer     │  (Data access, database queries)
│  - user.repository.go   │
│  - video.repository.go  │
└────────────┬─────────────┘
             ↓
┌─────────────────────────┐
│   DATABASE              │  (PostgreSQL)
│  - models/users.go      │
│  - models/videos.go     │
└─────────────────────────┘
```

### Data Flow

1. **Request comes in** → Controller handles HTTP request
2. **Controller** → Calls Service with Data Transfer Objects (DTOs)
3. **Service** → Implements business logic, calls Repository
4. **Repository** → Queries database using Models
5. **Response** → Returns through layers back to client

### Installed Libraries

| Library                         | Version | Purpose                                                 |
| ------------------------------- | ------- | ------------------------------------------------------- |
| `github.com/gin-gonic/gin`      | v1.9.1  | Web framework for building REST APIs                    |
| `gorm.io/gorm`                  | v1.25.0 | Object-Relational Mapping (ORM) for database operations |
| `gorm.io/driver/postgres`       | v1.5.0  | PostgreSQL driver for GORM                              |
| `github.com/joho/godotenv`      | v1.5.1  | Load environment variables from .env files              |
| `github.com/google/uuid`        | latest  | UUID generation for unique identifiers                  |
| `github.com/swaggo/swag`        | latest  | Swagger specification generator                         |
| `github.com/swaggo/gin-swagger` | latest  | Gin middleware for Swagger UI                           |
| `github.com/swaggo/files`       | latest  | Static files for Swagger UI                             |

### How to Start the Backend

#### Prerequisites

- Docker & Docker Compose installed
- Or: Go 1.25+ and PostgreSQL 17+ locally

#### Option 1: Using Docker Compose (Recommended)

```bash
cd backend
docker-compose up -d --build
```

This command:

- Builds the backend container
- Starts PostgreSQL service
- Runs the backend on `http://localhost:8088`

#### Option 2: Local Development

1. **Install dependencies:**

   ```bash
   cd backend
   go mod tidy
   ```

2. **Setup PostgreSQL:**
   - Ensure PostgreSQL is running locally
   - Create a database named `unitube`
   - Update credentials in `.env` file

3. **Configure environment variables:**
   Create a `.env` file in the backend directory:

   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=user
   DB_PASSWORD=password
   DB_NAME=unitube
   ```

4. **Run the backend:**
   ```bash
   go run main.go
   ```

### API Access

Once the backend is running:

- **API Base URL:** `http://localhost:8088/api/v1`
- **Swagger UI:** `http://localhost:8088/swagger/index.html`
- **Database:** PostgreSQL on `localhost:5432`

### Available Endpoints

- **User Routes:** `/api/v1/users`
  - CRUD operations for user management

- **Video Routes:** `/api/v1/videos`
  - CRUD operations for video management

Visit the Swagger UI for detailed endpoint documentation.

---

## Frontend

TypeScript + React application built with Vite.

### Getting Started

```bash
cd frontend
npm install
npm run dev
```

---

## Project Stack

- **Backend:** Go 1.25, Gin, GORM, PostgreSQL
- **Frontend:** TypeScript, React, Vite
- **Database:** PostgreSQL 17
- **Containerization:** Docker & Docker Compose
