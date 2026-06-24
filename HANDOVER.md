# Project Handover: RANKFORGE (Backend & AI Engine Deployment Guide)

Hi there! This document outlines what has been accomplished in this project so far and details the remaining tasks to successfully deploy the backend and AI Engine services.

---

## 🚀 What Has Been Done So Far

We have implemented critical security upgrades, visual redesigns, anti-cheat enforcement, and containerization optimizations:

### 1. Frontend Redesign & Optimizations (`frontend/`)
*   **Security Patch**: Upgraded Next.js to version `14.2.21` to patch security vulnerabilities.
*   **Premium Dark Theme**: Redesigned all main views (Dashboard, Attempt, Results, Login, Register, components, sidebar) into a polished, responsive premium dark-mode theme.
*   **Interactive Features**: Added eye-toggle icons on login and register pages to hide/show passwords.
*   **Anti-Cheat Implementation**: Configured event listeners in the exam browser window to detect when a user blurs the screen, changes tabs, or opens the developer console. It increments violation counts and pushes warning banners to the user.

### 2. Backend API & Engine Updates (`backend/`)
*   **Unified Error Handling**: Implemented centralized error middleware (`src/middleware/error.middleware.ts`) returning standardized JSON schemas.
*   **Anti-Cheat Enforcement**:
    *   Created validation endpoints (`POST /api/tests/cheat-log`) to log screen-blur / tab-change events directly.
    *   Implemented backend **Session Locks** and **Server-side Timers** inside `src/services/test.service.ts` to prevent users from starting multiple concurrent test sessions or altering the client-side clock.
*   **TypeScript Validation**: Added explicit typings for calculations in analytics services to prevent build/compilation errors.

### 3. Containerization & Networking Configuration
*   **Prisma OpenSSL Fix**: Switched backend Docker image from alpine to `node:18-slim` and added explicit commands to install `openssl` in both builder/runner environments. This resolves binary-engine lookup failures for Prisma client on production.
*   **Port Mapping**: Changed the external backend port binding from `5000` to `5001` (to prevent AirPlay conflicts on macOS), while keeping the internal port `5000`.
*   **Build-time API Routing**: Structured the Docker Compose setup to pass `NEXT_PUBLIC_API_URL` during frontend build stages, which embeds the backend API URL on client-side requests correctly.

---

## 🛠️ Your Tasks (Backend & AI-Engine Deployment)

Since the frontend is already deployed, your goal is to set up the **PostgreSQL database**, **Redis cache**, **FastAPI AI engine**, and the **Express backend API**.

### 1. Database & Schema Deployment
The backend uses **Prisma** to manage relationships with a PostgreSQL database.
1. Set up a PostgreSQL instance (e.g., AWS RDS, Supabase, Neon, or a VM database).
2. Grab the connection URL and configure it in the backend's environment variables as `DATABASE_URL`.
3. Push/apply the schema definition from `backend/prisma/schema.prisma` to the database:
   ```bash
   cd backend
   npx prisma db push
   # OR run migrations
   npx prisma migrate deploy
   ```

### 2. Redis Caching Deployment
*   The backend relies on Redis to manage real-time analytics data cache.
*   Provision a Redis instance (e.g., Upstash Redis, Redis Cloud, AWS ElastiCache, or a local Redis container).
*   Export the connection URL as `REDIS_URL` in the environment variables (e.g., `redis://<host>:<port>`).

### 3. Deploy the AI Engine (FastAPI)
The machine learning prediction service runs in `ai-engine/`.
*   It's a Python FastAPI application configured with a `Dockerfile`.
*   **Manual Deployment**:
    ```bash
    cd ai-engine
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```
*   **Docker Deployment**: Use `ai-engine/Dockerfile` to build and deploy.
*   Once deployed, copy its public URL. This will be needed by the Express backend.

### 4. Deploy the Backend Service (Express.js)
The core backend API is configured with `backend/Dockerfile` using multi-stage builds.
*   Configure the environment variables (see below).
*   Build and run the container using:
    ```bash
    cd backend
    docker build -t rankforge-backend .
    docker run -p 5000:5000 --env-file .env rankforge-backend
    ```

---

## 📋 Environment Variables Checklist

Please configure the following environment variables on your backend hosting platform (or write them in a `.env` file in the backend root directory):

```env
# Application Context
NODE_ENV=production
PORT=5000

# Authentication Securites
JWT_SECRET=your_long_random_jwt_secret_key
JWT_EXPIRES_IN=7d

# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<dbname>?sslmode=require

# Redis Connection
REDIS_URL=redis://<username>:<password>@<host>:<port>

# AI Engine Endpoint
AI_ENGINE_URL=http://<deployed-ai-engine-url>:8000
```

> [!IMPORTANT]
> Once the backend API URL is live (e.g., `https://api.rankforge.com`), make sure the frontend's `NEXT_PUBLIC_API_URL` environment variable is updated to point to `https://api.rankforge.com/api`. This must be set **before** or **during** the frontend build phase, as Next.js bundles environment variables starting with `NEXT_PUBLIC_` statically during the build step.

If you have any questions or hit a roadblock with Prisma or Docker build stages, let me know!
