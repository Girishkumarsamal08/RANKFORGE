# RANKFORGE – AI-Powered GATE Mock Testing & Rank Prediction Platform

RANKFORGE is a multi-service SaaS platform for GATE aspirants to attempt simulated assessments (MCQs, MSQs, NATs), track focus metrics via anti-cheat triggers, predict All India Ranks (AIR) via statistical distributions, and analyze vulnerability subjects using normal distribution classifiers.

---

## Technical Stack

*   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Redux Toolkit, TanStack Query, Axios.
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, JWT.
*   **AI Engine**: FastAPI (Python), statistical models for rank distributions.
*   **Infrastructure**: Docker, Docker Compose.

---

## Directory Structure

```
RANKFORGE/
├── docker-compose.yml           # Orchestrates services
├── .env.example                 # Base configurations environment file
├── README.md                    # Setup and guide instructions
├── ai-engine/                   # Python FastAPI service for ML prediction
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/                     # Main backend python source
├── backend/                     # Node.js Express service for user exam lifecycles
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/                  # Schema files database setup
│   └── src/                     # Core express router endpoints
└── frontend/                    # Next.js client dashboard
    ├── Dockerfile
    ├── package.json
    └── src/                     # Components and page layouts
```

---

## Port Allocation Matrix

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `3000` | Client Dashboard UI |
| **Backend** | `5000` | Express REST Endpoints |
| **AI Engine** | `8000` | FastAPI ML predictions |
| **PostgreSQL** | `5432` | Relational Storage |
| **Redis** | `6379` | Analytics Cache |

---

## Setup & Running the Platform

### Option A: Using Docker Compose (Recommended)

1.  Clone this repository to your system.
2.  Copy `.env.example` to `.env` in the root:
    ```bash
    cp .env.example .env
    ```
3.  Launch the entire multi-service container cluster:
    ```bash
    docker-compose up --build
    ```
4.  Once containers are running, generate database tables by executing Prisma migrations inside the backend container:
    ```bash
    docker-compose exec backend npx prisma migrate dev --name init
    ```

---

### Option B: Local Manual Development

#### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   PostgreSQL & Redis active instances

#### 1. Setup Database
Update `.env` in the root (and in `backend/` or `frontend/` directories if needed) with local Postgres `DATABASE_URL` and Redis `REDIS_URL`.

#### 2. Run AI Engine (FastAPI)
```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Run Backend (Express + Prisma)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

#### 4. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## Anti-Cheat Verification Hooks

*   The Next.js attempt screen (`frontend/src/app/tests/attempt/page.tsx`) registers tab-monitoring and window blur events.
*   Triggers automatically make background calls to `POST /api/tests/cheat-log` to archive event tracking.
*   Warning counts are displayed dynamically to the student.

---

## License
MIT
