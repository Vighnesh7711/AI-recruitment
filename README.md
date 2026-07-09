# AuraRecruit — AI-Powered Recruitment & Interactive Avatar Interview Platform

AuraRecruit is a state-of-the-art AI-driven recruitment automation platform. It features automated resume parsing, ATS evaluation scoring, job posting managers, scheduled interviews, and real-time interactive AI talking-avatar interviews (via text and voice). It leverages Node.js, FastAPI, React + Vite, Mongoose, and Google's Gemini 2.5/Flash AI models, orchestrated with an integrated local or cloud n8n workflow system.

---

## 📂 Repository Structure

The project is structured as an `npm workspaces` monorepo. Here is a breakdown of the overall file structure:

```text
ai-interview-platform/
├── client/                     # Vite + React 18 + TypeScript Frontend Client
│   ├── src/
│   │   ├── components/         # Reusable UI components (buttons, layout, forms)
│   │   ├── lib/                # Library utilities (axios client, configs)
│   │   ├── pages/              # Main routing views (Careers, Profiles, Dashboards)
│   │   ├── App.tsx             # React routes and state providers
│   │   └── index.css           # Styling setup (TailwindCSS integration)
│   ├── vercel.json             # Vercel deployment configuration
│   └── package.json
│
├── server/                     # Node.js + Express + TypeScript Backend API Server
│   ├── src/
│   │   ├── lib/                # Client configurations (Cloudinary, MongoDB connection)
│   │   ├── middleware/         # Auth verification, role guards, rate limiters
│   │   ├── routes/             # REST endpoints (auth, job, application, interview)
│   │   ├── utils/              # Helper utilities (tokens, hashing)
│   │   ├── scheduler.ts        # Node-cron background jobs for reminders
│   │   └── index.ts            # Entry point for backend Express app (Port 5000)
│   └── package.json
│
├── python-ai/                  # Python 3.11+ FastAPI Service (Resume Parser + Evaluator)
│   ├── app/
│   │   ├── main.py             # FastAPI routing, PyMuPDF extraction, Gemini 2.5 SDK
│   │   └── __init__.py
│   ├── requirements.txt        # Core Python dependencies (fastapi, google-genai, PyMuPDF)
│   └── venv/                   # Python virtual environment (ignored from git)
│
├── avatar-service/             # Express Node.js Wrapper for Talking Avatar SDK/APIs
│   ├── src/
│   │   └── index.ts            # Avatar audio, visual streams, and health (Port 5002)
│   └── package.json
│
├── database/                   # Shared MongoDB Schemas & Seeding Utils
│   ├── User.ts                 # Candidate & HR User schemas
│   ├── JobPosting.ts           # Job requirements, salary, state parameters
│   ├── Application.ts          # Tracks resume, status, and scores
│   ├── Interview.ts            # Scheduled timings, token, and session variables
│   ├── InterviewEvaluation.ts  # Technical, grammar, and communication ratings
│   ├── connection.ts           # Database bootstrap/connection checks
│   ├── seed.ts                 # Seeds mock candidates, jobs, and companies
│   └── tsconfig.json
│
├── n8n/                        # n8n Automation Workflows (JSON imports)
│   ├── README.md               # Quick setup guidelines for webhook automation
│   ├── registration.json       # Candidate welcome email workflow
│   ├── resume_rejected.json    # Detailed feedback mail for rejected candidates
│   ├── interview_scheduled.json# Email invites + Google Calendar sync
│   ├── interview_reminder.json # Periodic schedules checking upcoming sessions
│   ├── interview_complete.json # Sheets sync + HR summary mailer
│   └── offer_email.json        # Dispatches official job offer letters
│
├── docs/                       # Architectural Blueprint & Contracts
│   ├── architecture.md         # Data flows, models, service communication
│   ├── api-contracts.md        # Detailed endpoints mapping & JSON paylods
│   └── deployment.md           # Instructions for Vercel, Render & MongoDB Atlas
│
├── start-all.bat               # Windows launcher script for all services
├── start-all.ps1               # PowerShell launcher script for all services
├── start-all.sh                # macOS/Linux launcher script (background traps)
├── stop-all.bat                # Windows script to kill active ports
├── stop-all.sh                 # macOS/Linux script to kill active ports
├── install-all.bat             # Automates installation on Windows
├── install-all.sh              # Automates installation on macOS/Linux
├── package.json                # Monorepo workspaces config & global scripts
└── README.md                   # Project documentation (this file)
```

---

## ⚙️ Architecture & Service Connections

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

### Port Mapping Summary

| Service Name        | Environment / Tech | Default Port | Primary Function                           |
| :------------------ | :----------------- | :----------- | :----------------------------------------- |
| **Client Frontend** | Vite + React + TS  | `5173`       | Main candidate/HR UI                       |
| **API Server**      | Node.js + Express  | `5000`       | Database, routing, scheduler, webhooks     |
| **Python AI**       | Python + FastAPI   | `8002`       | PyMuPDF text parser, Gemini ATS grading    |
| **Avatar Wrapper**  | Node.js + Express  | `5002`       | Direct audio/visual talking chatbot engine |
| **n8n Automation**  | n8n engine         | `5678`       | External notification & email dispatch     |

---

## 🔄 Core Workflow: How It Works

Here is the operational lifecycle of a candidate applying through AuraRecruit:

1.  **Candidate Registration:** Candidate signs up on Frontend -> triggers Express backend -> fires `registration` webhook to local/external n8n -> n8n dispatches a welcoming HTML email via Gmail.
2.  **Resume Upload & Cloudinary Host:** Candidate uploads a PDF resume. The Express server uploads it to Cloudinary, saving the secure HTTPS URL to MongoDB.
3.  **FastAPI PyMuPDF parsing:** The server triggers the Python FastAPI service with the PDF URL. FastAPI downloads the PDF, extracts layout text using PyMuPDF, and groups the text into sections (skills, education, experience, etc.) using heuristic regex models.
4.  **Google Gemini ATS scoring:** FastAPI sends the extracted resume text, job description, and required skills to Google's Gemini (using `gemini-2.5-flash` model and strict JSON output schemas). Gemini returns an ATS match score (0-100), missing skills list, matched skills, strengths, weaknesses, and concrete recommendations.
5.  **Auto-decision shortlisting:** Express server stores the results. If the score is below the threshold, it triggers an n8n webhook (`resume_rejected`) to email the candidate feedback. If it meets the threshold, they are shortlisted.
6.  **Interview Scheduling:** HR logs in, reviews the shortlist, and schedules an interactive avatar interview. This fires an n8n webhook (`interview_scheduled`) which sends an invite email containing a unique candidate session token, and automatically inserts a timed event on the interviewer's Google Calendar.
7.  **Interactive Talking Avatar Interview:** Candidate launches the interview page. The React UI displays the 3D talking avatar wrapper (rendered from the local Express avatar service on port 5002) and captures mic/text inputs.
8.  **Real-Time Gemini Evaluation:** At the end of the interview, candidate responses are sent to Gemini to rate their technical depth, grammar, communication, and confidence.
9.  **Weighted Decision and Offer:** The final score is computed as: `Final Score = 30% ATS Score + 70% Interview Score`. HR reviews the leaderboard. Selecting "Hire" triggers n8n (`offer_email`) to generate and send an official PDF job offer.

---

## 🛠️ Prerequisites & Machine Requirements

Ensure the target machine has the following tools installed:

1. **Node.js** (v18.x or v20.x recommended)
2. **Python** (v3.11.x, v3.12.x, or v3.13.x)
3. **pip** (Python package installer)
4. **Git** (version control)
5. **MongoDB Atlas Account** (or a local MongoDB instance running on port 27017)
6. **Cloudinary Account** (for resume and image upload hosting)
7. **Google Cloud Platform credentials** (if using Google Calendar / Gmail integration via n8n)

---

## 🚀 Step-by-Step Setup Instructions

Choose either the **Automated Setup** (recommended) or **Manual Setup** for your operating system.

### Option A: Automated Setup (Bypasses manual CLI errors)

We have created bootstrapper scripts that clean cache, install packages globally & locally, verify Python venv setup, and output template `.env` files.

#### 1. On Windows

Open command prompt or PowerShell inside the root folder and run:

```cmd
install-all.bat
```

#### 2. On macOS or Linux

Open your terminal inside the root folder and run:

```bash
chmod +x install-all.sh
./install-all.sh
```

---

### Option B: Manual Setup

If you prefer to configure each system manually, perform these tasks:

#### Step 1: Root Node Modules Installation

At the root directory, install the monorepo workspace dependencies:

```bash
npm install
```

#### Step 2: Set up Python Virtual Environment

Navigate to `python-ai`, create a virtual environment, activate it, and install required dependencies.

- **On Windows (Command Prompt)**:
  ```cmd
  cd python-ai
  python -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements.txt
  cd ..
  ```
- **On Windows (PowerShell)**:
  ```powershell
  cd python-ai
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  cd ..
  ```
- **On macOS/Linux**:
  ```bash
  cd python-ai
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  cd ..
  ```

#### Step 3: Seed the Database

Seed the database with initial mock companies, mock job listings, and admin users:

```bash
# This compiles and runs database/seed.ts using tsx compiler
npx tsx database/seed.ts
```

---

## 🔒 Environment Variables Reference

Copy the `.env.example` templates in each folder (or update the generated `.env` files created by our installer scripts) with your keys.

### 1. Client Environment (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_AVATAR_URL=http://localhost:5002
VITE_APP_NAME=AuraRecruit Platform
```

### 2. Express Server Environment (`server/.env`)

```env
# Server configs
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/aurarecruit?retryWrites=true&w=majority

# Security (JWT)
JWT_SECRET=super_random_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# Google Gemini API
GEMINI_API_KEY=AIzaSy...your_gemini_key

# Cross-Service Connections
PYTHON_AI_URL=http://localhost:8002
AVATAR_SERVICE_URL=http://localhost:5002

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Upload specifications
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
MAX_RESUME_SIZE_MB=5

# n8n Automation Webhooks (Adjust when running n8n locally)
N8N_WEBHOOK_REGISTRATION=http://localhost:5678/webhook/registration
N8N_WEBHOOK_RESUME_REJECTED=http://localhost:5678/webhook/resume-rejected
N8N_WEBHOOK_INTERVIEW_SCHEDULED=http://localhost:5678/webhook/interview-scheduled
N8N_WEBHOOK_INTERVIEW_REMINDER=http://localhost:5678/webhook/interview-reminder
N8N_WEBHOOK_INTERVIEW_COMPLETE=http://localhost:5678/webhook/interview-complete
N8N_WEBHOOK_OFFER=http://localhost:5678/webhook/offer
```

### 3. Python AI Environment (`python-ai/.env`)

```env
APP_ENV=development
PORT=8002
SERVER_URL=http://localhost:5000
GEMINI_API_KEY=AIzaSy...your_gemini_key
```

### 4. Avatar Service Environment (`avatar-service/.env`)

```env
NODE_ENV=development
PORT=5002
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=AIzaSy...your_gemini_key
```

---

## 🤖 Local n8n Setup & Webhooks Orchestrator

n8n is used to trigger candidate registration emails, send interactive calendar events, perform database-to-spreadsheet synchronization, and dispatch PDF offer letters.

### Step 1: Launch n8n Locally

To run a local instance of n8n, run the following command in the root folder:

```bash
npx n8n start
```

_Alternatively, install it globally:_

```bash
npm install -g n8n
n8n start
```

After launch, n8n will run at: **`http://localhost:5678`**

### Step 2: Import Workflow JSON Files

1. Open `http://localhost:5678` in your browser.
2. In the sidebar, select **Workflows** -> **Add Workflow** -> **Import from File**.
3. Import the following files from the `n8n/` directory of the repo:
   - `registration.json`
   - `resume_rejected.json`
   - `interview_scheduled.json`
   - `interview_reminder.json`
   - `interview_complete.json`
   - `offer_email.json`

### Step 3: Configure n8n External OAuth Credentials

Within the n8n UI, navigate to **Credentials** and configure:

1. **Gmail OAuth2**: Required for sending candidate feedback emails, offer letters, and confirmation notes.
2. **Google Calendar OAuth2**: Required by `interview_scheduled` to generate dynamic interview invites.
3. **Google Sheets OAuth2**: Used by `interview_complete` to append performance feedback rows. Configure your target spreadsheet's `spreadsheetId`.

### Step 4: Routing Webhooks Locally & Using ngrok

When running n8n locally, external APIs (like Gmail/Calendar webhooks) cannot call back to `http://localhost:5678` directly.

> [!TIP]
> If all systems (Express Server, FastAPI, and n8n) are running on the same local network / machine, you can safely use `http://localhost:5678` directly inside `server/.env`.
> However, if you need external OAuth callback integration or want to preview webhooks online:
>
> 1. Download and install [ngrok](https://ngrok.com/).
> 2. Spin up an HTTP tunnel on the n8n port:
>    ```bash
>    ngrok http 5678
>    ```
> 3. Copy the secure public HTTPS URL generated (e.g., `https://xxxx.ngrok-free.app`).
> 4. Launch n8n passing this tunnel as the webhook URL:
>    ```bash
>    # On Windows (cmd):
>    set WEBHOOK_URL=https://xxxx.ngrok-free.app && npx n8n start
>
>    # On macOS/Linux:
>    WEBHOOK_URL=https://xxxx.ngrok-free.app npx n8n start
>    ```
> 5. Update the corresponding `N8N_WEBHOOK_*` environment variables in `server/.env` with your secure ngrok public URL.

---

## 🏃 Running the Application

### 1. Launching All Services (One Command)

- **On Windows (Command Prompt)**:
  ```cmd
  start-all.bat
  ```
- **On Windows (PowerShell)**:
  ```powershell
  .\start-all.ps1
  ```
- **On macOS / Linux**:
  ```bash
  chmod +x start-all.sh
  ./start-all.sh
  ```

### 2. Launching Services Individually

If you prefer to open separate terminal tabs:

- **Vite Frontend Client (Port 5173)**:
  ```bash
  npm run dev:client
  ```
- **Node.js Express API Server (Port 5000)**:
  ```bash
  npm run dev:server
  ```
- **Python FastAPI AI Service (Port 8002)**:
  ```bash
  # Windows:
  python-ai\venv\Scripts\python -m uvicorn python-ai.app.main:app --reload --port 8002

  # macOS/Linux:
  ./python-ai/venv/bin/python -m uvicorn app.main:app --reload --port 8002
  ```
- **Express Avatar Service (Port 5002)**:
  ```bash
  npm run dev:avatar
  ```
- **n8n Server (Port 5678)**:
  ```bash
  npx n8n start
  ```

### 🛑 Stopping All Services

To kill any running servers occupying development ports:

- **Windows**: Run `stop-all.bat`
- **macOS / Linux**: Run `./stop-all.sh`

---

## 🔧 Troubleshooting & Error Bypassing FAQ

### Q1: `uvicorn` is not recognized as an internal or external command

- **Cause**: You have not activated the virtual environment or the dependencies are not installed inside it.
- **Bypass**: Always use the active Python binary in the virtual environment. Ensure you run `pip install -r requirements.txt` after activating.
- **Tip**: On Windows PowerShell, if execution policy blocks scripts, run:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
  ```
  Then run `.\venv\Scripts\Activate.ps1`.

### Q2: Gemini API responses throw `google.genai` import/attribute errors

- **Cause**: You have installed the legacy `google-generativeai` package instead of the brand new `google-genai` SDK, or your package version is outdated.
- **Bypass**: Run:
  ```bash
  pip uninstall google-generativeai
  pip install google-genai>=1.0.0
  ```
  This project uses the official modern `google-genai` library (`genai.Client(api_key=...)` syntax).

### Q3: Candidate resumes cannot be parsed or fail with `PARSE_FAILED`

- **Cause**: Cloudinary keys are incorrect, or the PDF has scanned image layers instead of raw text.
- **Bypass**:
  1. Confirm `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are correctly defined in `server/.env`.
  2. Try uploading a text-searchable PDF. Scanned images (OCR required) are bypassed by the lightweight `PyMuPDF` parser. Ensure the PDF contains actual text characters.

### Q4: CORS blocked errors in frontend console logs

- **Cause**: Mismatch between the domains configured in `.env` and the request source.
- **Bypass**: Check CORS settings:
  - In `server/.env`, verify `CLIENT_URL` is set to `http://localhost:5173`.
  - In `python-ai/.env`, check `SERVER_URL` points to `http://localhost:5000`.
  - In `avatar-service/.env`, check `CLIENT_URL` matches your frontend domain.

### Q5: MongoDB Atlas connection timeout

- **Cause**: MongoDB Atlas has IP whitelisting enabled by default, blocking connection requests from your new machine's IP.
- **Bypass**: Go to your MongoDB Atlas dashboard -> **Security** -> **Network Access** -> click **Add IP Address** -> Select **Allow Access From Anywhere** (IP `0.0.0.0/0`) for development.

### Q6: n8n webhook returns a 404 or 403 when triggered by the Express backend

- **Cause**: You are firing the webhook using a Production URL when n8n is only in Test Mode, or the workflow has not been set to **Active** (toggle in upper right).
- **Bypass**:
  1. If testing step-by-step, change the server webhook URLs from `/webhook/` to `/webhook-test/`.
  2. To make webhooks live, click **Active** in n8n for each workflow. Make sure to toggle it on.

### Q7: Shared database schemas throw path errors or compilation issues

- **Cause**: Mismatch in building or resolving shared dependencies in workspaces.
- **Bypass**: Run `npm run show-tokens` or compile typescript manually by running `npx tsc -b` from the project root. This triggers compilation across all monorepo scopes.
