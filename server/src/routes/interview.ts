import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import {
  Interview,
  InterviewReminder,
  Application,
  JobPosting,
  Company,
  User,
  InterviewEvaluation,
} from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/errors';
import logger from '../lib/logger';

const router = Router();

/**
 * POST /interview
 * Body: { applicationId, schedule, durationMinutes }
 * Schedules an interview for a shortlisted application, fires n8n webhook, and creates reminder.
 */
router.post(
  '/',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { applicationId, schedule, durationMinutes } = req.body;

      if (!applicationId || !schedule || !durationMinutes) {
        throw new AppError(
          'applicationId, schedule, and durationMinutes are required.',
          400,
          'VALIDATION_ERROR'
        );
      }

      // 1. Fetch application
      const application = await Application.findById(applicationId);
      if (!application) {
        throw new AppError('Application not found.', 404, 'NOT_FOUND');
      }

      // Verify status is shortlisted
      if (application.status !== 'shortlisted') {
        throw new AppError(
          'Interview can only be scheduled for shortlisted applications.',
          400,
          'INVALID_STATUS'
        );
      }

      // 2. Fetch Job and check HR ownership
      const job = await JobPosting.findById(application.jobId);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }

      if (job.postedBy.toString() !== req.user!._id.toString()) {
        throw new AppError(
          'You do not have permission to schedule interviews for this application.',
          403,
          'FORBIDDEN'
        );
      }

      // 3. Fetch Candidate and Company details for the webhook
      const candidate = await User.findById(application.candidateId);
      if (!candidate) {
        throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
      }

      let companyName = 'Our Company';
      if (job.companyId) {
        const company = await Company.findById(job.companyId);
        if (company) {
          companyName = company.name;
        }
      }

      const scheduleDate = new Date(schedule);
      if (isNaN(scheduleDate.getTime())) {
        throw new AppError('Invalid schedule date format.', 400, 'VALIDATION_ERROR');
      }

      // 4. Create Interview
      const token = crypto.randomBytes(32).toString('hex');
      // Set expiration to 7 days from now or 48 hours after schedule
      const expiresAt = new Date(scheduleDate.getTime() + 48 * 60 * 60 * 1000);

      const interview = await Interview.create({
        applicationId: application._id,
        candidateId: application.candidateId,
        jobId: application.jobId,
        token,
        status: 'pending',
        scheduledAt: scheduleDate,
        expiresAt,
        duration: Number(durationMinutes),
        invitedBy: req.user!._id,
      });

      // 5. Update Application status
      application.status = 'interview_scheduled';
      await application.save();

      // 6. Create Interview Reminder (scheduledTime = schedule - 24 hours)
      const reminderTime = new Date(scheduleDate.getTime() - 24 * 60 * 60 * 1000);
      await InterviewReminder.create({
        interviewId: interview._id,
        scheduledTime: reminderTime,
        candidateEmailSent: false,
        hrEmailSent: false,
      });

      // 7. Fire N8N_WEBHOOK_INTERVIEW_SCHEDULED
      const webhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_SCHEDULED;
      if (webhookUrl) {
        try {
          await axios.post(
            webhookUrl,
            {
              candidateId: candidate._id.toString(),
              candidateEmail: candidate.email,
              candidateName: candidate.fullName,
              applicationId: application._id.toString(),
              interviewId: interview._id.toString(),
              interviewToken: token,
              schedule: scheduleDate.toISOString(),
              durationMinutes: Number(durationMinutes),
              jobTitle: job.title,
              companyName,
              hrEmail: req.user!.email,
              isReschedule: false,
            },
            { timeout: 5000 }
          );
          logger.info(
            `[Interview] N8N interview-scheduled webhook fired for application ${application._id}`
          );
        } catch (webhookErr: any) {
          logger.warn(`[Interview] N8N webhook failed to fire: ${webhookErr.message}`);
        }
      }

      res.status(201).json({
        message: 'Interview scheduled successfully.',
        interview,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /interview/:id/reschedule
 * Body: { schedule, durationMinutes }
 * Reschedules an existing interview, resets reminders, and fires the reschedule webhook.
 */
router.patch(
  '/:id/reschedule',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { schedule, durationMinutes } = req.body;

      if (!schedule) {
        throw new AppError('schedule date is required.', 400, 'VALIDATION_ERROR');
      }

      const interview = await Interview.findById(id);
      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }

      // Check HR ownership
      if (interview.invitedBy.toString() !== req.user!._id.toString()) {
        throw new AppError(
          'You do not have permission to reschedule this interview.',
          403,
          'FORBIDDEN'
        );
      }

      const scheduleDate = new Date(schedule);
      if (isNaN(scheduleDate.getTime())) {
        throw new AppError('Invalid schedule date format.', 400, 'VALIDATION_ERROR');
      }

      // Update Interview fields
      interview.scheduledAt = scheduleDate;
      if (durationMinutes) {
        interview.duration = Number(durationMinutes);
      }
      interview.expiresAt = new Date(scheduleDate.getTime() + 48 * 60 * 60 * 1000);
      await interview.save();

      // Update or recreate Reminder (scheduledTime = schedule - 24 hours)
      const reminderTime = new Date(scheduleDate.getTime() - 24 * 60 * 60 * 1000);
      await InterviewReminder.findOneAndUpdate(
        { interviewId: interview._id },
        {
          scheduledTime: reminderTime,
          candidateEmailSent: false,
          hrEmailSent: false,
        },
        { upsert: true }
      );

      // Fetch additional fields for webhook payload
      const candidate = await User.findById(interview.candidateId);
      const job = await JobPosting.findById(interview.jobId);
      let companyName = 'Our Company';
      if (job?.companyId) {
        const company = await Company.findById(job.companyId);
        if (company) companyName = company.name;
      }

      // Fire reschedule webhook
      const webhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_SCHEDULED;
      if (webhookUrl && candidate && job) {
        try {
          await axios.post(
            webhookUrl,
            {
              candidateId: candidate._id.toString(),
              candidateEmail: candidate.email,
              candidateName: candidate.fullName,
              applicationId: interview.applicationId.toString(),
              interviewId: interview._id.toString(),
              interviewToken: interview.token,
              schedule: scheduleDate.toISOString(),
              durationMinutes: interview.duration,
              jobTitle: job.title,
              companyName,
              hrEmail: req.user!.email,
              isReschedule: true,
            },
            { timeout: 5000 }
          );
          logger.info(
            `[Interview] N8N interview rescheduled webhook fired for interview ${interview._id}`
          );
        } catch (webhookErr: any) {
          logger.warn(`[Interview] N8N reschedule webhook failed to fire: ${webhookErr.message}`);
        }
      }

      res.json({
        message: 'Interview rescheduled successfully.',
        interview,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /interview/reminders/due
 * Returns interview_reminders where scheduledTime <= now AND (candidateEmailSent === false OR hrEmailSent === false)
 */
router.get(
  '/reminders/due',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const reminders = await InterviewReminder.find({
        scheduledTime: { $lte: now },
        $or: [{ candidateEmailSent: false }, { hrEmailSent: false }],
      });

      const detailedReminders = [];
      for (const reminder of reminders) {
        const interview = await Interview.findById(reminder.interviewId);
        if (!interview) continue;
        const candidate = await User.findById(interview.candidateId);
        const hr = await User.findById(interview.invitedBy);
        const job = await JobPosting.findById(interview.jobId);
        if (!candidate || !job) continue;
        let companyName = 'Our Company';
        if (job.companyId) {
          const company = await Company.findById(job.companyId);
          if (company) companyName = company.name;
        }
        detailedReminders.push({
          _id: reminder._id.toString(),
          interviewId: interview._id.toString(),
          candidateEmail: candidate.email,
          candidateName: candidate.fullName,
          hrEmail: hr?.email || '',
          schedule: interview.scheduledAt ? interview.scheduledAt.toISOString() : '',
          durationMinutes: interview.duration || 45,
          jobTitle: job.title,
          companyName,
        });
      }
      res.json(detailedReminders);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /interview/reminders/:id
 * Marks a reminder's emails as sent.
 */
router.patch(
  '/reminders/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reminder = await InterviewReminder.findByIdAndUpdate(
        id,
        { candidateEmailSent: true, hrEmailSent: true },
        { new: true }
      );
      if (!reminder) {
        throw new AppError('Interview reminder not found.', 404, 'NOT_FOUND');
      }
      res.json({ message: 'Reminder marked as sent.', reminder });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /interview/:id/calendar-synced
 * Sets calendarSynced = true on the Interview document.
 */
router.patch(
  '/:id/calendar-synced',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const interview = await Interview.findByIdAndUpdate(
        id,
        { calendarSynced: true },
        { new: true }
      );
      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }
      res.json({ message: 'Interview calendar sync status updated.', interview });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /interview/:id
 * Fetches details of a specific interview (accessible by candidate or HR).
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const interview = await Interview.findById(id)
        .populate('candidateId', 'fullName email phone')
        .populate('jobId', 'title department location');

      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }

      // Access checks: must be candidate, or the HR who invited them
      const isCandidate = interview.candidateId._id.toString() === req.user!._id.toString();
      const isInvitingHr = interview.invitedBy.toString() === req.user!._id.toString();

      if (!isCandidate && !isInvitingHr && req.user!.role !== 'admin') {
        throw new AppError('You do not have permission to view this interview.', 403, 'FORBIDDEN');
      }

      res.json(interview);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /interview
 * Query: ?applicationId=
 * Lists interviews (filtered by applicationId). Access restricted to candidate/HR.
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { applicationId } = req.query;
      const filter: any = {};

      if (applicationId) {
        filter.applicationId = applicationId;
      }

      const interviews = await Interview.find(filter)
        .populate('candidateId', 'fullName email phone')
        .populate('jobId', 'title department location')
        .sort({ scheduledAt: -1 });

      // Access checks
      const filtered = interviews.filter((interview) => {
        const isCandidate = interview.candidateId._id.toString() === req.user!._id.toString();
        const isInvitingHr = interview.invitedBy.toString() === req.user!._id.toString();
        return isCandidate || isInvitingHr || req.user!.role === 'admin';
      });

      res.json(filtered);
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to generate 10 questions using Gemini or fallback
async function generateQuestions(job: any): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('[Interview] GEMINI_API_KEY not found in environment, using fallback questions');
    return generateFallbackQuestions(job);
  }

  const prompt = `You are an expert HR interviewer. Generate exactly 10 interview questions for the job role: "${job.title}".
Job Description: "${job.description}"
Required Skills: ${(job.skills || []).join(', ')}
Requirements: ${(job.requirements || []).join(', ')}

Provide questions across these categories:
- technical: questions related to technical skills, coding, architecture, etc.
- behavioral: questions starting with "Tell me about a time...", conflict resolution, leadership, etc.
- situational: questions about hypothetical problem-solving scenarios.
- culture_fit: questions evaluating alignment with company values, teamwork, growth mindset, etc.

Return ONLY a valid JSON array of objects, with no markdown fences, no code blocks, no extra text:
[
  {
    "questionId": "q1",
    "text": "The question content",
    "category": "technical" | "behavioral" | "situational" | "culture_fit",
    "weight": 1
  },
  ...
]`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const questions = JSON.parse(text);
    if (Array.isArray(questions) && questions.length === 10) {
      return questions.map((q, idx) => ({
        questionId: q.questionId || `q_${idx + 1}`,
        text: q.text,
        category: q.category || 'technical',
        weight: q.weight || 1,
      }));
    }
  } catch (err: any) {
    logger.warn(`[Interview] Failed to generate questions via Gemini, using fallback. Error: ${err.message}`);
  }

  return generateFallbackQuestions(job);
}

function generateFallbackQuestions(job: any): any[] {
  const title = job.title || 'Software Engineer';
  return [
    {
      questionId: 'q1',
      text: `Can you start by introducing yourself and summarizing your experience related to ${title}?`,
      category: 'culture_fit',
      weight: 1
    },
    {
      questionId: 'q2',
      text: `What are the key technical skills you bring that match the requirements of the ${title} role?`,
      category: 'technical',
      weight: 1
    },
    {
      questionId: 'q3',
      text: `Tell me about a challenging technical project you worked on recently. What was your role and how did you overcome the difficulties?`,
      category: 'behavioral',
      weight: 1
    },
    {
      questionId: 'q4',
      text: `How do you approach learning new technologies or frameworks when starting a new project?`,
      category: 'culture_fit',
      weight: 1
    },
    {
      questionId: 'q5',
      text: `Imagine you are asked to design a scalable feature but face conflicting requirements from stakeholders. How do you resolve this?`,
      category: 'situational',
      weight: 1
    },
    {
      questionId: 'q6',
      text: `Describe a situation where you had to debug a complex production issue under time pressure. What steps did you take?`,
      category: 'behavioral',
      weight: 1
    },
    {
      questionId: 'q7',
      text: `How do you ensure the quality of your code, and what is your experience with writing tests and performing code reviews?`,
      category: 'technical',
      weight: 1
    },
    {
      questionId: 'q8',
      text: `If you noticed a team member was falling behind on their deliverables, how would you approach them?`,
      category: 'situational',
      weight: 1
    },
    {
      questionId: 'q9',
      text: `What motivates you to perform your best work, and how do you align with the goals of this position?`,
      category: 'culture_fit',
      weight: 1
    },
    {
      questionId: 'q10',
      text: `Finally, what questions do you have for us, or is there anything else you'd like to share about your candidacy?`,
      category: 'culture_fit',
      weight: 1
    }
  ];
}

/**
 * POST /interview/:id/start-avatar
 * Starts the avatar session, generates/fetches 10 questions, and triggers the first question.
 */
router.post(
  '/:id/start-avatar',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const interview = await Interview.findById(id);
      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }

      if (interview.candidateId.toString() !== req.user!._id.toString()) {
        throw new AppError('You do not have access to this interview.', 403, 'FORBIDDEN');
      }

      if (interview.status !== 'pending' && interview.status !== 'in_progress') {
        throw new AppError('Interview is not in a valid state to start.', 400, 'INVALID_STATUS');
      }

      if (interview.status === 'pending') {
        interview.status = 'in_progress';
        interview.startedAt = new Date();
      }

      // Generate questions if not already present
      if (!interview.questions || interview.questions.length === 0) {
        const job = await JobPosting.findById(interview.jobId);
        if (!job) {
          throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
        }
        const generated = await generateQuestions(job);
        interview.questions = generated;
      }

      await interview.save();

      // Call avatar-service to start session
      const avatarServiceUrl = process.env.AVATAR_SERVICE_URL || 'http://localhost:5002';
      let sessionId = '';
      try {
        const sessionRes = await axios.post(`${avatarServiceUrl}/avatar/session/start`, {
          interviewId: interview._id.toString(),
        });
        sessionId = sessionRes.data.sessionId;

        // Trigger avatar to speak the first question
        const firstQuestion = interview.questions[0].text;
        await axios.post(`${avatarServiceUrl}/avatar/ask`, {
          sessionId,
          questionText: firstQuestion,
        });
      } catch (err: any) {
        logger.error(`[Interview] Failed to communicate with avatar-service: ${err.message}`);
        throw new AppError('Failed to initialize avatar session.', 502, 'AVATAR_SERVICE_ERROR');
      }

      res.json({
        message: 'Avatar interview session started successfully.',
        sessionId,
        questions: interview.questions,
        firstQuestion: interview.questions[0].text,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /interview/:id/answer
 * Triggers avatar-service transcription, evaluates the answer via python-ai, saves scores,
 * and handles flow transition (next question or completion).
 */
router.post(
  '/:id/answer',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { sessionId, questionId } = req.body;

      if (!sessionId || !questionId) {
        throw new AppError('sessionId and questionId are required.', 400, 'VALIDATION_ERROR');
      }

      const interview = await Interview.findById(id);
      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }

      if (interview.candidateId.toString() !== req.user!._id.toString()) {
        throw new AppError('You do not have access to this interview.', 403, 'FORBIDDEN');
      }

      if (interview.status !== 'in_progress') {
        throw new AppError('Interview is not currently in progress.', 400, 'INVALID_STATUS');
      }

      // Find the current question index
      const questionIndex = interview.questions.findIndex((q) => q.questionId === questionId);
      if (questionIndex === -1) {
        throw new AppError('Question not found in this interview.', 400, 'NOT_FOUND');
      }

      const currentQuestion = interview.questions[questionIndex];

      // 1. Call avatar-service listen endpoint (blocks until user uploads audio)
      const avatarServiceUrl = process.env.AVATAR_SERVICE_URL || 'http://localhost:5002';
      let transcript = '';
      try {
        const listenRes = await axios.post(`${avatarServiceUrl}/avatar/listen`, { sessionId });
        transcript = listenRes.data.transcript;
      } catch (err: any) {
        logger.error(`[Interview] Failed to get transcription from avatar-service: ${err.message}`);
        throw new AppError('Failed to retrieve transcription from voice response.', 502, 'AVATAR_SERVICE_ERROR');
      }

      // Save transcript
      currentQuestion.candidateAnswer = transcript;

      // 2. Fetch Job Details for context-aware scoring
      const job = await JobPosting.findById(interview.jobId);
      if (!job) {
        throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
      }

      const expectedAnswerGuideline = `The candidate should provide a professional response demonstrating knowledge or experience related to the question: '${currentQuestion.text}'. Key aspects: relevant to a ${job.title} role, addressing required skills: ${(job.skills || []).join(', ')}.`;

      // 3. Call python-ai evaluate-answer endpoint
      const pythonAiUrl = process.env.PYTHON_AI_URL || 'http://localhost:5001';
      let aiScore = 5;
      let aiFeedback = 'Response recorded successfully.';

      try {
        const evalRes = await axios.post(`${pythonAiUrl}/evaluate-answer`, {
          question: currentQuestion.text,
          expectedAnswer: expectedAnswerGuideline,
          candidateAnswer: transcript,
        });

        aiScore = evalRes.data.overall_score;
        aiFeedback = evalRes.data.feedback;
      } catch (err: any) {
        logger.warn(`[Interview] Failed to evaluate answer via python-ai: ${err.message}. Falling back to default scoring.`);
      }

      currentQuestion.aiScore = aiScore;
      currentQuestion.aiFeedback = aiFeedback;

      await interview.save();

      // Check if there is a next question
      const nextIndex = questionIndex + 1;
      const isDone = nextIndex >= interview.questions.length;

      if (!isDone) {
        // Trigger avatar-service to speak the next question
        const nextQuestion = interview.questions[nextIndex];
        try {
          await axios.post(`${avatarServiceUrl}/avatar/ask`, {
            sessionId,
            questionText: nextQuestion.text,
          });
        } catch (err: any) {
          logger.warn(`[Interview] Failed to push next question to avatar-service: ${err.message}`);
        }

        res.json({
          transcript,
          nextQuestion: nextQuestion.text,
          nextQuestionId: nextQuestion.questionId,
          currentQuestionIndex: nextIndex,
          done: false,
        });
      } else {
        // Complete the interview!
        interview.status = 'completed';
        interview.completedAt = new Date();
        await interview.save();

        // End the avatar session
        try {
          await axios.post(`${avatarServiceUrl}/avatar/session/end`, { sessionId });
        } catch {}

        // Compute avgInterviewScore (0-10 scale)
        const totalScore = interview.questions.reduce((sum, q) => sum + (q.aiScore || 0), 0);
        const avgInterviewScore = totalScore / interview.questions.length;
        const overallInterviewScore = avgInterviewScore * 10; // Normalize to 0-100

        // Fetch application to get atsScore
        const application = await Application.findById(interview.applicationId);
        if (!application) {
          throw new AppError('Associated application not found.', 404, 'NOT_FOUND');
        }

        const atsScore = application.atsScore || 70;
        const finalWeightedScore = Math.round(atsScore * 0.3 + overallInterviewScore * 0.7);

        // Perform holistic evaluation using Gemini API key
        let technicalScore = overallInterviewScore;
        let communicationScore = overallInterviewScore;
        let problemSolvingScore = overallInterviewScore;
        let cultureFitScore = overallInterviewScore;
        let confidenceScore = overallInterviewScore;
        let strengths: string[] = ['Clear communication', 'Good understanding of core concepts'];
        let weaknesses: string[] = ['Could provide more specific examples'];
        let summary = 'The candidate completed the automated avatar interview and responded to all questions.';
        let recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire' = 'maybe';

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const holisticPrompt = `You are a senior recruiter evaluating a candidate's full interview performance.
Job Title: "${job.title}"
Job Description: "${job.description}"

Here is the transcript of the interview with questions and candidate answers:
${interview.questions.map((q, idx) => `Q${idx + 1}: ${q.text}\nCandidate Answer: ${q.candidateAnswer}\nAI Feedback: ${q.aiFeedback}`).join('\n\n')}

Provide a comprehensive evaluation. Return ONLY a valid JSON object matching this schema (do NOT include markdown formatting or code blocks):
{
  "technicalScore": number 0-100,
  "communicationScore": number 0-100,
  "problemSolvingScore": number 0-100,
  "cultureFitScore": number 0-100,
  "confidenceScore": number 0-100,
  "strengths": string[],
  "weaknesses": string[],
  "summary": string,
  "recommendation": "strong_hire" | "hire" | "maybe" | "no_hire" | "strong_no_hire"
}`;

          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const evalResponse = await axios.post(url, {
              contents: [{ parts: [{ text: holisticPrompt }] }]
            });

            let evalText = evalResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            evalText = evalText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedEval = JSON.parse(evalText);

            technicalScore = typeof parsedEval.technicalScore === 'number' ? parsedEval.technicalScore : technicalScore;
            communicationScore = typeof parsedEval.communicationScore === 'number' ? parsedEval.communicationScore : communicationScore;
            problemSolvingScore = typeof parsedEval.problemSolvingScore === 'number' ? parsedEval.problemSolvingScore : problemSolvingScore;
            cultureFitScore = typeof parsedEval.cultureFitScore === 'number' ? parsedEval.cultureFitScore : cultureFitScore;
            confidenceScore = typeof parsedEval.confidenceScore === 'number' ? parsedEval.confidenceScore : confidenceScore;
            strengths = Array.isArray(parsedEval.strengths) ? parsedEval.strengths : strengths;
            weaknesses = Array.isArray(parsedEval.weaknesses) ? parsedEval.weaknesses : weaknesses;
            summary = parsedEval.summary || summary;
            if (['strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire'].includes(parsedEval.recommendation)) {
              recommendation = parsedEval.recommendation;
            }
          } catch (err: any) {
            logger.warn(`[Interview] Failed to run holistic evaluation: ${err.message}. Using default parameters.`);
          }
        }

        // Create InterviewEvaluation document
        await InterviewEvaluation.create({
          interviewId: interview._id,
          applicationId: application._id,
          candidateId: interview.candidateId,
          technicalScore,
          communicationScore,
          problemSolvingScore,
          cultureFitScore,
          confidenceScore,
          overallInterviewScore,
          atsScore,
          finalWeightedScore,
          strengths,
          weaknesses,
          summary,
          recommendation,
          hrDecision: 'pending',
        });

        // Update application
        application.finalScore = finalWeightedScore;
        application.status = 'interviewed';
        await application.save();

        // Update interview status to evaluated
        interview.status = 'evaluated';
        await interview.save();

        // Fire N8N_WEBHOOK_INTERVIEW_COMPLETE
        const completeWebhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_COMPLETE;
        if (completeWebhookUrl) {
          try {
            const candidate = await User.findById(interview.candidateId);
            const hr = await User.findById(interview.invitedBy);
            await axios.post(
              completeWebhookUrl,
              {
                candidateId: interview.candidateId.toString(),
                candidateName: candidate?.fullName || 'Candidate',
                candidateEmail: candidate?.email || '',
                applicationId: application._id.toString(),
                interviewId: interview._id.toString(),
                overallInterviewScore,
                atsScore,
                finalWeightedScore,
                recommendation,
                jobTitle: job.title,
                hrEmail: hr?.email || '',
              },
              { timeout: 5000 }
            );
            logger.info(`[Interview] N8N interview-complete webhook fired for application ${application._id}`);
          } catch (webhookErr: any) {
            logger.warn(`[Interview] N8N interview-complete webhook failed to fire: ${webhookErr.message}`);
          }
        }

        res.json({
          transcript,
          done: true,
          overallInterviewScore,
          finalWeightedScore,
          recommendation,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
