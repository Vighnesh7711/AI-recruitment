# API Contracts

> **Note:** This document is a living stub. Endpoints are documented as each prompt adds them.

## Server (Express API) — Base URL: `/api`

### Health

| Method | Path      | Auth | Description          |
| ------ | --------- | ---- | -------------------- |
| GET    | `/health` | No   | Service health check |

### Auth (Prompt 2)

| Method | Path                           | Auth | Rate Limited | Description                               |
| ------ | ------------------------------ | ---- | ------------ | ----------------------------------------- |
| POST   | `/api/auth/register/hr`        | No   | 10/15min/IP  | Register HR user with profile             |
| POST   | `/api/auth/register/candidate` | No   | 10/15min/IP  | Register Candidate user with profile      |
| POST   | `/api/auth/verify-email`       | No   | No           | Verify email via token                    |
| POST   | `/api/auth/login`              | No   | 10/15min/IP  | Authenticate, returns JWT                 |
| POST   | `/api/auth/forgot-password`    | No   | No           | Send password reset link (console-logged) |
| POST   | `/api/auth/reset-password`     | No   | No           | Reset password via token                  |

### Company (Prompt 3)

| Method | Path               | Auth | Role   | Description                                         |
| ------ | ------------------ | ---- | ------ | --------------------------------------------------- |
| POST   | `/api/company`     | Yes  | HR     | Create company, link to HR (logo upload via multer) |
| PUT    | `/api/company/:id` | Yes  | HR     | Update company profile (ownership verified)         |
| GET    | `/api/company/:id` | No   | Public | Fetch public company details                        |

### Jobs (Prompt 3)

| Method | Path                   | Auth | Role   | Description                                                     |
| ------ | ---------------------- | ---- | ------ | --------------------------------------------------------------- |
| POST   | `/api/jobs`            | Yes  | HR     | Create job posting in 'draft' status                            |
| GET    | `/api/jobs`            | No   | Public | List jobs (candidates only see active; HR sees all)             |
| GET    | `/api/jobs/:id`        | No   | Public | Retrieve single job details (ownership checks for non-active)   |
| PUT    | `/api/jobs/:id`        | Yes  | HR     | Update job posting details (ownership verified)                 |
| PATCH  | `/api/jobs/:id/status` | Yes  | HR     | Update status (draft/active/paused/closed) (ownership verified) |
| DELETE | `/api/jobs/:id`        | Yes  | HR     | Delete job posting (ownership verified)                         |

### Resumes (Prompt 5)

| Method | Path                      | Auth | Role      | Description                                                               |
| ------ | ------------------------- | ---- | --------- | ------------------------------------------------------------------------- |
| POST   | `/api/resume`             | Yes  | Candidate | Upload a PDF resume to Cloudinary and create document                     |
| GET    | `/api/resume/mine`        | Yes  | Candidate | List current candidate's uploaded resumes                                 |
| POST   | `/api/resume/:id/analyze` | Yes  | HR, Admin | Run parser and analysis against a job posting, saving and decision-gating |

### Applications (Prompt 5)

| Method | Path                          | Auth | Role      | Description                                                              |
| ------ | ----------------------------- | ---- | --------- | ------------------------------------------------------------------------ |
| POST   | `/api/application`            | Yes  | Candidate | Apply for active job (validates active status, owner resume, unique app) |
| GET    | `/api/application/mine`       | Yes  | Candidate | List current candidate's applications with populated job details         |
| GET    | `/api/application/:id`        | Yes  | Candidate | Fetch specific application detail with candidate ownership verification  |
| PATCH  | `/api/application/:id/status` | Yes  | HR        | Shortlist or reject a candidate application (ownership verified)         |
| GET    | `/api/application`            | Yes  | HR        | List all candidate applications for jobs posted by the logged-in HR      |

### Interviews (Prompt 7)

| Method | Path                            | Auth | Role          | Description                                                          |
| ------ | ------------------------------- | ---- | ------------- | -------------------------------------------------------------------- |
| POST   | `/api/interview`                | Yes  | HR            | Schedule a new interview for a shortlisted application, fire webhook |
| PATCH  | `/api/interview/:id/reschedule` | Yes  | HR            | Reschedule an existing interview, update reminders, fire webhook     |
| GET    | `/api/interview/:id`            | Yes  | Candidate, HR | Retrieve details for a specific interview session                    |
| GET    | `/api/interview`                | Yes  | Candidate, HR | List interviews, optionally filtered by `applicationId`              |

#### Webhook Contract: `N8N_WEBHOOK_INTERVIEW_SCHEDULED`

Fires automatically from the server on interview creation or rescheduling.
**Payload Schema:**

```json
{
  "candidateId": "string (ObjectId)",
  "candidateEmail": "string",
  "candidateName": "string",
  "applicationId": "string (ObjectId)",
  "interviewId": "string (ObjectId)",
  "interviewToken": "string (secure token)",
  "schedule": "string (ISO 8601 datetime)",
  "durationMinutes": 45,
  "jobTitle": "string",
  "companyName": "string",
  "hrEmail": "string",
  "isReschedule": false
}
```

### Analytics (Prompt 6+)

_To be documented_

---

## Python AI Service (FastAPI) — Base URL: `/`

### Health

| Method | Path       | Auth | Description          |
| ------ | ---------- | ---- | -------------------- |
| GET    | `/healthz` | No   | Service health check |

### Resume Parsing & AI Analysis (Prompt 6)

| Method | Path              | Auth | Description                                                                                  |
| ------ | ----------------- | ---- | -------------------------------------------------------------------------------------------- |
| POST   | `/parse-resume`   | No   | Download PDF, parse via PyMuPDF, segment into sections                                       |
| POST   | `/analyze-resume` | No   | Analyze resume text against job requirements via Google Gemini, return score and suggestions |

---

## Avatar Service (Express) — Base URL: `/`

### Health

| Method | Path      | Auth | Description          |
| ------ | --------- | ---- | -------------------- |
| GET    | `/health` | No   | Service health check |

### Avatar Endpoints (Prompt 8)

| Method | Path             | Auth | Status | Description                             |
| ------ | ---------------- | ---- | ------ | --------------------------------------- |
| POST   | `/avatar/ask`    | No   | 501    | Placeholder — send question to avatar   |
| POST   | `/avatar/listen` | No   | 501    | Placeholder — stream candidate response |
