# n8n Workflow Reference

This directory contains 6 importable n8n workflow JSON files for the AuraRecruit platform.

## Workflows

| # | File | Trigger | Description |
|---|------|---------|-------------|
| 1 | `registration.json` | Webhook `POST /webhook/registration` | Sends welcome email on user sign-up |
| 2 | `resume_rejected.json` | Webhook `POST /webhook/resume-rejected` | Sends improvement email with weaknesses/recommendations |
| 3 | `interview_scheduled.json` | Webhook `POST /webhook/interview-scheduled` | Sends invite email, creates Google Calendar event, calls back `PATCH /interview/:id/calendar-synced` |
| 4 | `interview_reminder.json` | Schedule Trigger (every 15 min) | Polls `GET /interview/reminders/due`, sends reminder, marks sent via `PATCH /interview/reminders/:id` |
| 5 | `interview_complete.json` | Webhook `POST /webhook/interview-complete` | Appends row to Google Sheets, emails HR with evaluation summary |
| 6 | `offer_email.json` | Webhook `POST /webhook/offer` | Sends official offer letter to candidate |

## Setup

1. **Self-host n8n** or use [n8n Cloud](https://n8n.io/cloud/).
2. Import each `.json` file via **Workflow → Import from File**.
3. Configure **Gmail OAuth2** credentials in n8n (used by all email nodes).
4. Configure **Google Calendar OAuth2** credentials (used by `interview_scheduled`).
5. Configure **Google Sheets OAuth2** credentials and set the `spreadsheetId` in `interview_complete`.
6. Update the `N8N_WEBHOOK_*` environment variables in `server/.env` to point to your n8n instance.
7. For `interview_reminder`, ensure the HTTP Request nodes point to your deployed server URL instead of `localhost`.

## Payload Shapes

Each webhook expects the payload documented in `docs/api-contracts.md`.
The server fires these webhooks automatically — you do **not** need to call them manually.
