# Mini Kanban Board — Full-Stack Application

A modern, high-performance, SaaS-inspired Mini Kanban Board application built with Next.js 16 (React 19), Express.js, TypeScript, Prisma 7, PostgreSQL, and `@dnd-kit`.

---

## 🚀 Features

- **Authentication & JWT**: User registration, login, JWT token management, and auto-session restoration via `/api/auth/me`.
- **Board Management**: Workspace dashboard, create, edit, view, and delete project boards with confirmation modals.
- **Member Collaboration & Roles**: Board sharing with role-based permissions:
  - **OWNER**: Full control over board configuration, deletion, and member management.
  - **EDITOR**: Can manage columns, create/edit/delete tasks, and move tasks.
  - **VIEWER**: Read-only access to boards, columns, and tasks.
- **Kanban Task Management**:
  - Drag-and-drop task movement within columns and across columns.
  - Priority indicators (`LOW`, `MEDIUM`, `HIGH`) and due date support.
  - Task creation, editing, and deletion modals.
  - Column creation, renaming, and deletion.
- **Fractional Task Positioning**: Tasks use floating-point fractional indexes (`position`) allowing instant reordering without updating every row in the database.
- **Serialized Task Movement Queue**: Rapid drag-and-drop actions are queued sequentially client-side to guarantee race-condition-free server persistence.
- **Docker Containerization**: Production-ready multi-stage Dockerfiles and `docker-compose.yml` orchestrating PostgreSQL 16, backend API, and Next.js frontend.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **State & Data Fetching**: TanStack React Query v5, Axios
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Language**: TypeScript

### Backend (`/`)
- **Runtime**: Node.js 20+, Express.js 5
- **ORM & DB**: Prisma 7, PostgreSQL
- **Auth & Security**: JWT (`jsonwebtoken`), `bcryptjs`, Cookie Parser, CORS
- **Language**: TypeScript (`tsx`)

---

## 📂 Project Structure

```text
mini-kanban-board/
├── client/                      # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                 # App Router pages (/login, /register, /boards, /boards/[boardId])
│   │   ├── components/          # Reusable UI components (layout, kanban, boards, members)
│   │   ├── hooks/               # Custom React hooks (useBoardPermissions)
│   │   ├── lib/                 # Axios instance & Auth utilities
│   │   ├── providers/           # AuthProvider, QueryProvider, ToastProvider
│   │   ├── services/            # API service calls (board, column, task)
│   │   └── types/               # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
├── src/                         # Express Backend Application
│   ├── config/                  # Environment configuration
│   ├── errors/                  # Custom AppError & error handler
│   ├── middlewares/             # auth, boardAuth, requireBoardOwner, globalErrorHandler
│   ├── modules/                 # Modular API controllers, services, validations, routes
│   │   ├── auth/
│   │   ├── board/
│   │   ├── column/
│   │   └── task/
│   ├── server.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma            # PostgreSQL Database Schema
├── docker-compose.yml           # Docker Compose Orchestration
├── Dockerfile                   # Backend Dockerfile
├── package.json
└── README.md
```

---

## 🧮 Task Ordering Mechanism

### Fractional Position Indexing
Tasks are ordered using a floating-point `position` property. When a task is inserted between Task A (position $P_A$) and Task B (position $P_B$), the new position is computed as:

$$\text{Position}_{\text{new}} = \frac{P_A + P_B}{2}$$

This eliminates expensive bulk update queries across hundreds of tasks.

### Serialized Move Queue
To prevent race conditions during rapid drag-and-drop actions, the frontend processes task move API calls sequentially using a Promise queue:

```ts
moveQueueRef.current = moveQueueRef.current
  .catch(() => {})
  .then(async () => {
    // calculate position based on active state
    // call /api/boards/:boardId/tasks/:taskId/move
    // update cache
  });
```

---

## 🔑 API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive access/refresh tokens
- `GET  /api/auth/me` — Fetch currently authenticated user profile

### Boards (`/api/boards`)
- `GET    /api/boards` — List user's boards (owned & member boards)
- `POST   /api/boards` — Create a new board
- `GET    /api/boards/:boardId` — Get full board details & members
- `GET    /api/boards/:boardId/summary` — Get board columns and task counts
- `PATCH  /api/boards/:boardId` — Update board title & description (Owner only)
- `DELETE /api/boards/:boardId` — Delete board (Owner only)

### Board Members (`/api/boards/:boardId/members`)
- `GET    /api/boards/:boardId/members` — List board members
- `POST   /api/boards/:boardId/members` — Add member by User ID with role (`VIEWER` / `EDITOR`) (Owner only)
- `DELETE /api/boards/:boardId/members/:userId` — Remove member (Owner only)

### Columns (`/api/boards/:boardId/columns`)
- `GET    /api/boards/:boardId/columns` — List columns
- `POST   /api/boards/:boardId/columns` — Create column (Editor/Owner)
- `PATCH  /api/boards/:boardId/columns/:columnId` — Rename column (Editor/Owner)
- `DELETE /api/boards/:boardId/columns/:columnId` — Delete column (Editor/Owner)

### Tasks (`/api/boards/:boardId/...`)
- `POST   /api/boards/:boardId/columns/:columnId/tasks` — Create task
- `GET    /api/boards/:boardId/columns/:columnId/tasks` — List tasks for column
- `PATCH  /api/boards/:boardId/columns/:columnId/tasks/:taskId` — Update task details
- `PATCH  /api/boards/:boardId/tasks/:taskId/move` — Move/reorder task
- `DELETE /api/boards/:boardId/tasks/:taskId` — Delete task

---

## ⚡ Quickstart & Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database instance

### 1. Backend Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Generate Prisma Client & Migrate DB
npm run prisma:generate
npm run prisma:migrate

# Start development server (Port 4000)
npm run dev
```

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server (Port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🐳 Docker Deployment

To launch the full stack (PostgreSQL, Backend API, Next.js Frontend) using Docker:

```bash
# Build and start all services
docker compose up --build -d

# View service logs
docker compose logs -f

# Stop all services
docker compose down
```

Services:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`
- **PostgreSQL**: `localhost:5432`
