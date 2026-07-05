# AI Interview Platform — Monorepo

This repository is an npm-workspaces monorepo containing the frontend client, backend server, FastAPI AI service, and Express talking avatar service.

## Repository Structure

- `client/` — Vite + React 18 + TypeScript, TailwindCSS, shadcn/ui, react-router-dom, axios, framer-motion.
- `server/` — Node.js + Express + TypeScript, mongoose, jsonwebtoken, multer, bcrypt, cors, dotenv, morgan, express-rate-limit.
- `python-ai/` — Python 3.13+, FastAPI, uvicorn, PyMuPDF, python-dotenv, google-genai (Gemini SDK).
- `avatar-service/` — Node/Express TypeScript wrapper (health check + placeholder routes).
- `n8n/` — n8n integration workflows README.
- `docs/` — Architecture design and API contracts documentation.
- `database/` — Shared Mongoose schema definitions (one file per collection).

---

## Architecture Diagram

```
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │   (Vite + TS)        │
                    │   Port 5173          │
                    │   Deployed: Vercel   │
                    └──────────┬───────────┘
                               │ REST (axios)
                               ▼
                    ┌──────────────────────┐
                    │   Node.js API Server │
                    │   (Express + TS)     │
                    │   Port 5000          │
                    │   Deployed: Render   │
                    └──────┬───────┬───────┘
                           │       │
              REST (axios) │       │ REST (axios)
                           ▼       ▼
          ┌────────────────────┐  ┌─────────────────────┐
          │  Python AI Service │  │  Avatar Service      │
          │  (FastAPI)         │  │  (Express + TS)      │
          │  Port 8002         │  │  Port 5002           │
          │  Deployed: Render  │  │  Deployed: Render    │
          └────────┬───────────┘  └──────────┬──────────┘
                   │                          │
                   │  Google Gemini API       │  Gemini API
                   │  (resume parse, ATS)     │  (avatar AI)
                   ▼                          ▼
          ┌──────────────────────────────────────────────┐
          │              MongoDB Atlas                    │
          │   Collections: users, companies, job_postings│
          │   applications, interviews, evaluations,     │
          │   notifications, activity_logs               │
          └──────────────────────────────────────────────┘
```

For a detailed breakdown of service-to-service communication, auth flows, and data flow lifecycles, refer to [docs/architecture.md](docs/architecture.md).

---

## Required Environment Variables (Names Only)

Each service contains a `.env.example` file that shows how to configure the environment. Here is a summary of the required environment variable names:

### 1. Client (`client/.env.example`)

- `VITE_API_URL`
- `VITE_AVATAR_URL`
- `VITE_APP_NAME`

### 2. Server (`server/.env.example`)

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GEMINI_API_KEY`
- `PYTHON_AI_URL`
- `AVATAR_SERVICE_URL`
- `CLIENT_URL`
- `UPLOAD_DIR`
- `MAX_FILE_SIZE`

### 3. Python AI Service (`python-ai/.env.example`)

- `APP_ENV`
- `GEMINI_API_KEY`
- `SERVER_URL`
- `PORT`

### 4. Avatar Service (`avatar-service/.env.example`)

- `NODE_ENV`
- `PORT`
- `SERVER_URL`
- `GEMINI_API_KEY`
- `CLIENT_URL`

---

## Running Locally

First, ensure you have Node.js (v18+) and Python (v3.11+) installed.

### Step 1: Install Dependencies

Run npm install at the root to install all workspace dependencies (client, server, avatar-service):

```bash
npm install
```

For the Python AI service, set up a virtual environment and install dependencies:

```bash
cd python-ai
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env` in `client/`, `server/`, `python-ai/`, and `avatar-service/` and fill in the values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
cp python-ai/.env.example python-ai/.env
cp avatar-service/.env.example avatar-service/.env
```

### Step 3: Run Dev Servers

You can run each service using the monorepo scripts:

- Run React Client:
  ```bash
  npm run dev:client
  ```
- Run Express API Server:
  ```bash
  npm run dev:server
  ```
- Run Avatar Service:
  ```bash
  npm run dev:avatar
  ```
- Run Python AI Service:
  ```bash
  npm run dev:python
  ```
