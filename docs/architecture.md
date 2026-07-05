# Architecture Overview

## System Diagram

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

## Service Communication

| From           | To             | Protocol             | Purpose                                  |
| -------------- | -------------- | -------------------- | ---------------------------------------- |
| Client         | Server         | REST/HTTPS           | All CRUD ops, auth, job management       |
| Client         | Avatar Service | REST/HTTPS           | Interview avatar UI communication        |
| Server         | Python AI      | REST/HTTP (internal) | Resume parsing, ATS scoring, AI matching |
| Server         | Avatar Service | REST/HTTP (internal) | Trigger avatar interview sessions        |
| Server         | MongoDB        | MongoDB protocol     | Data persistence                         |
| Python AI      | Gemini API     | REST/HTTPS           | LLM-powered resume analysis              |
| Avatar Service | Gemini API     | REST/HTTPS           | Conversational AI for interviews         |

## Authentication Flow

1. Client sends credentials to `POST /api/auth/login` on Server
2. Server validates against MongoDB, returns JWT access token
3. Client includes `Authorization: Bearer <token>` on all subsequent requests
4. Server middleware validates JWT on protected routes
5. Server proxies authenticated requests to Python AI / Avatar Service as needed

## Data Flow — Application Lifecycle

```
Candidate applies (resume upload)
        │
        ▼
Server stores application + sends resume to Python AI
        │
        ▼
Python AI: PyMuPDF extracts text → Gemini parses structured data
        │
        ▼
Python AI: Gemini scores resume against job description (ATS)
        │
        ▼
Server stores ATS score → auto-reject if < threshold
        │
        ▼
HR/Admin reviews shortlisted candidates → sends interview invite
        │
        ▼
Avatar Service conducts AI interview (Gemini-powered)
        │
        ▼
Server: final_score = 0.3 * ats_score + 0.7 * interview_score
        │
        ▼
HR/Admin makes final hire/reject decision
```

## Technology Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Framer Motion |
| API Server | Node.js, Express, TypeScript, Mongoose, JWT                       |
| AI Service | Python 3.11+, FastAPI, PyMuPDF, Google Gemini SDK                 |
| Avatar     | Node.js, Express, TypeScript (wrapper for talking-avatar-with-ai) |
| Database   | MongoDB Atlas (Mongoose ODM)                                      |
| Deployment | Vercel (client), Render (server, python-ai, avatar-service)       |
| Workflows  | n8n (self-hosted, added in Prompt 10)                             |
