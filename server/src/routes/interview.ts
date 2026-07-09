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
  Candidate,
  Hr,
  QuestionBank,
  QuestionResponse,
  ResumeAnalysis,
} from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/errors';
import logger from '../lib/logger';

const router = Router();

/**
 * POST /interview
 * Body: { applicationId, schedule, durationMinutes }
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

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
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

      if (!job.companyId || !hr.companyId || job.companyId.toString() !== hr.companyId.toString()) {
        throw new AppError(
          'You do not have permission to schedule interviews for this application.',
          403,
          'FORBIDDEN'
        );
      }

      // 3. Fetch Candidate and Company details
      const candidate = await Candidate.findById(application.candidateId);
      if (!candidate) {
        throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
      }

      const candidateUser = await User.findById(candidate.userId);
      if (!candidateUser) {
        throw new AppError('Candidate user credentials not found.', 404, 'NOT_FOUND');
      }

      let companyName = 'Our Company';
      if (job.companyId) {
        const company = await Company.findById(job.companyId);
        if (company) {
          companyName = company.companyName;
        }
      }

      const scheduleDate = new Date(schedule);
      if (isNaN(scheduleDate.getTime())) {
        throw new AppError('Invalid schedule date format.', 400, 'VALIDATION_ERROR');
      }

      // 4. Create Interview
      const interview = await Interview.create({
        applicationId: application._id,
        schedule: scheduleDate,
        durationMinutes: Number(durationMinutes),
        meetingLink: `https://meet.jit.si/AI-Recruitment-${application._id}`,
        reminderSent: false,
        result: 'pending',
      });

      // 5. Update Application status
      application.status = 'interview_scheduled';
      await application.save();

      // 6. Create Interview Reminder (scheduledTime = schedule - 24 hours)
      const reminderTime = new Date(scheduleDate.getTime() - 24 * 60 * 60 * 1000);
      await InterviewReminder.create({
        interviewId: interview._id,
        scheduledTime: reminderTime,
        emailSent: false,
        whatsappSent: false,
        smsSent: false,
      });

      // 7. Fire N8N_WEBHOOK_INTERVIEW_SCHEDULED
      const webhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_SCHEDULED;
      if (webhookUrl) {
        try {
          await axios.post(
            webhookUrl,
            {
              candidateId: candidate._id.toString(),
              candidateEmail: candidateUser.email,
              candidateName: candidate.name,
              applicationId: application._id.toString(),
              interviewId: interview._id.toString(),
              interviewToken: interview._id.toString(), // use interviewId as token fallback
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

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }

      const interview = await Interview.findById(id);
      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }

      const application = await Application.findById(interview.applicationId);
      if (!application) {
        throw new AppError('Associated application not found.', 404, 'NOT_FOUND');
      }

      const job = await JobPosting.findById(application.jobId);
      if (!job) {
        throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
      }

      // Check HR ownership
      if (!job.companyId || !hr.companyId || job.companyId.toString() !== hr.companyId.toString()) {
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
      interview.schedule = scheduleDate;
      if (durationMinutes) {
        interview.durationMinutes = Number(durationMinutes);
      }
      await interview.save();

      // Update or recreate Reminder (scheduledTime = schedule - 24 hours)
      const reminderTime = new Date(scheduleDate.getTime() - 24 * 60 * 60 * 1000);
      await InterviewReminder.findOneAndUpdate(
        { interviewId: interview._id },
        {
          scheduledTime: reminderTime,
          emailSent: false,
          whatsappSent: false,
          smsSent: false,
        },
        { upsert: true }
      );

      // Fetch additional fields for webhook payload
      const candidate = await Candidate.findById(application.candidateId);
      const candidateUser = candidate ? await User.findById(candidate.userId) : null;
      let companyName = 'Our Company';
      if (job.companyId) {
        const company = await Company.findById(job.companyId);
        if (company) companyName = company.companyName;
      }

      // Fire reschedule webhook
      const webhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_SCHEDULED;
      if (webhookUrl && candidate && candidateUser) {
        try {
          await axios.post(
            webhookUrl,
            {
              candidateId: candidate._id.toString(),
              candidateEmail: candidateUser.email,
              candidateName: candidate.name,
              applicationId: interview.applicationId.toString(),
              interviewId: interview._id.toString(),
              interviewToken: interview._id.toString(),
              schedule: scheduleDate.toISOString(),
              durationMinutes: interview.durationMinutes,
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
 */
router.get(
  '/reminders/due',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const reminders = await InterviewReminder.find({
        scheduledTime: { $lte: now },
        emailSent: false,
      });

      const detailedReminders = [];
      for (const reminder of reminders) {
        const interview = await Interview.findById(reminder.interviewId);
        if (!interview) continue;
        const application = await Application.findById(interview.applicationId);
        if (!application) continue;
        const candidate = await Candidate.findById(application.candidateId);
        const candidateUser = candidate ? await User.findById(candidate.userId) : null;
        const job = await JobPosting.findById(application.jobId);
        if (!candidate || !candidateUser || !job) continue;

        const hr = await Hr.findById(job.hrId);
        const hrUser = hr ? await User.findById(hr.userId) : null;

        let companyName = 'Our Company';
        if (job.companyId) {
          const company = await Company.findById(job.companyId);
          if (company) companyName = company.companyName;
        }
        detailedReminders.push({
          _id: reminder._id.toString(),
          interviewId: interview._id.toString(),
          candidateEmail: candidateUser.email,
          candidateName: candidate.name,
          hrEmail: hrUser?.email || '',
          schedule: interview.schedule ? interview.schedule.toISOString() : '',
          durationMinutes: interview.durationMinutes || 45,
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
 */
router.patch(
  '/reminders/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reminder = await InterviewReminder.findByIdAndUpdate(
        id,
        { emailSent: true, whatsappSent: true, smsSent: true },
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
 */
router.patch(
  '/:id/calendar-synced',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      // calendarSynced is deprecated, we just return success
      res.json({ message: 'Interview calendar sync status updated.' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /interview/:id
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const interview = await Interview.findById(id);

      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }

      const application = await Application.findById(interview.applicationId);
      if (!application) {
        throw new AppError('Associated application not found.', 404, 'NOT_FOUND');
      }

      const candidate = await Candidate.findById(application.candidateId);
      const job = await JobPosting.findById(application.jobId).populate('companyId');

      if (!candidate || !job) {
        throw new AppError('Candidate or job information missing.', 404, 'NOT_FOUND');
      }

      // Check access permission
      const isCandidate = candidate.userId.toString() === req.user!._id.toString();
      const hr = await Hr.findOne({ userId: req.user!._id });
      const jobCompanyId =
        job.companyId && (job.companyId as any)._id
          ? (job.companyId as any)._id.toString()
          : (job.companyId as any)?.toString();
      const isInvitingHr =
        hr && jobCompanyId && hr.companyId && jobCompanyId === (hr.companyId as any).toString();

      if (!isCandidate && !isInvitingHr) {
        throw new AppError('You do not have permission to view this interview.', 403, 'FORBIDDEN');
      }

      const responses = await QuestionResponse.find({ interviewId: interview._id }).populate(
        'questionId'
      );
      const questionsList = responses.map((resp) => {
        const qBank: any = resp.questionId;
        return {
          questionId: resp._id.toString(),
          text: qBank ? qBank.question : '',
          candidateAnswer: resp.answer || '',
          aiScore: resp.aiScore || 0,
          aiFeedback: resp.feedback || '',
        };
      });

      const resObj = {
        _id: interview._id,
        applicationId: interview.applicationId,
        schedule: interview.schedule,
        scheduledAt: interview.schedule,
        durationMinutes: interview.durationMinutes,
        duration: interview.durationMinutes,
        meetingLink: interview.meetingLink,
        reminderSent: interview.reminderSent,
        overallScore: interview.overallScore,
        result: interview.result,
        status: interview.result === 'pending' ? 'pending' : interview.result,
        questions: questionsList,
        candidateId: {
          _id: candidate._id,
          fullName: candidate.name,
          name: candidate.name,
          phone: candidate.phone,
        },
        jobId: {
          _id: job._id,
          title: job.title,
          domain: job.domain,
          department: job.domain,
          location: 'Remote',
          companyId: job.companyId,
        },
      };

      res.json(resObj);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /interview
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

      const interviews = await Interview.find(filter).sort({ createdAt: -1 });
      const detailedInterviews = [];

      for (const interview of interviews) {
        const application = await Application.findById(interview.applicationId);
        if (!application) continue;

        const candidate = await Candidate.findById(application.candidateId);
        const job = await JobPosting.findById(application.jobId).populate('companyId');
        if (!candidate || !job) continue;

        const isCandidate = candidate.userId.toString() === req.user!._id.toString();
        const hr = await Hr.findOne({ userId: req.user!._id });
        const jobCompanyId =
          job.companyId && (job.companyId as any)._id
            ? (job.companyId as any)._id.toString()
            : (job.companyId as any)?.toString();
        const isInvitingHr =
          hr && jobCompanyId && hr.companyId && jobCompanyId === (hr.companyId as any).toString();

        if (isCandidate || isInvitingHr) {
          const responses = await QuestionResponse.find({ interviewId: interview._id }).populate(
            'questionId'
          );
          const questionsList = responses.map((resp) => {
            const qBank: any = resp.questionId;
            return {
              questionId: resp._id.toString(),
              text: qBank ? qBank.question : '',
              candidateAnswer: resp.answer || '',
              aiScore: resp.aiScore || 0,
              aiFeedback: resp.feedback || '',
            };
          });

          detailedInterviews.push({
            _id: interview._id,
            applicationId: interview.applicationId,
            schedule: interview.schedule,
            scheduledAt: interview.schedule,
            durationMinutes: interview.durationMinutes,
            duration: interview.durationMinutes,
            meetingLink: interview.meetingLink,
            reminderSent: interview.reminderSent,
            overallScore: interview.overallScore,
            result: interview.result,
            status: interview.result === 'pending' ? 'pending' : interview.result,
            questions: questionsList,
            candidateId: {
              _id: candidate._id,
              fullName: candidate.name,
              name: candidate.name,
              phone: candidate.phone,
            },
            jobId: {
              _id: job._id,
              title: job.title,
              domain: job.domain,
              department: job.domain,
              location: 'Remote',
              companyId: job.companyId,
            },
          });
        }
      }

      res.json(detailedInterviews);
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
Required Skills: ${(job.skillsRequired || []).join(', ')}

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
      contents: [{ parts: [{ text: prompt }] }],
    });

    let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
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
    logger.warn(
      `[Interview] Failed to generate questions via Gemini, using fallback. Error: ${err.message}`
    );
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
      weight: 1,
    },
    {
      questionId: 'q2',
      text: `What are the key technical skills you bring that match the requirements of the ${title} role?`,
      category: 'technical',
      weight: 1,
    },
    {
      questionId: 'q3',
      text: `Tell me about a challenging technical project you worked on recently. What was your role and how did you overcome the difficulties?`,
      category: 'behavioral',
      weight: 1,
    },
    {
      questionId: 'q4',
      text: `How do you approach learning new technologies or frameworks when starting a new project?`,
      category: 'culture_fit',
      weight: 1,
    },
    {
      questionId: 'q5',
      text: `Imagine you are asked to design a scalable feature but face conflicting requirements from stakeholders. How do you resolve this?`,
      category: 'situational',
      weight: 1,
    },
    {
      questionId: 'q6',
      text: `Describe a situation where you had to debug a complex production issue under time pressure. What steps did you take?`,
      category: 'behavioral',
      weight: 1,
    },
    {
      questionId: 'q7',
      text: `How do you ensure the quality of your code, and what is your experience with writing tests and performing code reviews?`,
      category: 'technical',
      weight: 1,
    },
    {
      questionId: 'q8',
      text: `If you noticed a team member was falling behind on their deliverables, how would you approach them?`,
      category: 'situational',
      weight: 1,
    },
    {
      questionId: 'q9',
      text: `What motivates you to perform your best work, and how do you align with the goals of this position?`,
      category: 'culture_fit',
      weight: 1,
    },
    {
      questionId: 'q10',
      text: `Finally, what questions do you have for us, or is there anything else you'd like to share about your candidacy?`,
      category: 'culture_fit',
      weight: 1,
    },
  ];
}

/**
 * POST /interview/:id/start-avatar
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

      const application = await Application.findById(interview.applicationId);
      if (!application) {
        throw new AppError('Associated application not found.', 404, 'NOT_FOUND');
      }

      const candidate = await Candidate.findById(application.candidateId);
      if (!candidate || candidate.userId.toString() !== req.user!._id.toString()) {
        throw new AppError('You do not have access to this interview.', 403, 'FORBIDDEN');
      }

      // Generate questions if not already present
      let responses = await QuestionResponse.find({ interviewId: interview._id })
        .populate('questionId')
        .sort({ questionOrder: 1 });
      if (responses.length === 0) {
        const job = await JobPosting.findById(application.jobId);
        if (!job) {
          throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
        }
        const generated = await generateQuestions(job);

        // Double check after generating to avoid race condition under concurrent calls (e.g. Strict Mode)
        const checkAgain = await QuestionResponse.find({ interviewId: interview._id })
          .populate('questionId')
          .sort({ questionOrder: 1 });
        if (checkAgain.length > 0) {
          responses = checkAgain;
        } else {
          responses = [];
          for (let idx = 0; idx < generated.length; idx++) {
            const q = generated[idx];
            try {
              const qBank = await QuestionBank.create({
                domain: job.domain,
                difficulty: 'medium',
                question: q.text,
                expectedAnswer: `Expected concepts: ${q.category}`,
                keywords: [q.category],
              });
              const qResp = await QuestionResponse.create({
                interviewId: interview._id,
                questionId: qBank._id,
                questionOrder: idx + 1,
              });
              (qResp as any).questionId = qBank; // simulate populate
              responses.push(qResp);
            } catch (err: any) {
              if (err.code === 11000) {
                logger.info(
                  `[Interview] Duplicate question response index detected. Falling back to existing responses.`
                );
                responses = await QuestionResponse.find({ interviewId: interview._id })
                  .populate('questionId')
                  .sort({ questionOrder: 1 });
                break;
              }
              throw err;
            }
          }
        }
      }

      // Call avatar-service to start session (optional — falls back to text-mode)
      const avatarServiceUrl = process.env.AVATAR_SERVICE_URL || 'http://localhost:5002';
      let sessionId = `text_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      let mode: 'avatar' | 'text' = 'text';
      try {
        const sessionRes = await axios.post(
          `${avatarServiceUrl}/avatar/session/start`,
          {
            interviewId: interview._id.toString(),
          },
          { timeout: 3000 }
        );
        sessionId = sessionRes.data.sessionId;
        mode = 'avatar';

        // Trigger avatar to speak the first question
        const firstQuestionBank: any = responses[0].questionId;
        const firstQuestion = firstQuestionBank ? firstQuestionBank.question : 'Hello';
        await axios.post(
          `${avatarServiceUrl}/avatar/ask`,
          {
            sessionId,
            questionText: firstQuestion,
          },
          { timeout: 3000 }
        );
      } catch (err: any) {
        logger.warn(
          `[Interview] Avatar-service unavailable, falling back to text-mode: ${err.message}`
        );
        mode = 'text';
      }

      const questionsList = responses.map((resp) => {
        const qBank: any = resp.questionId;
        return {
          questionId: resp._id.toString(),
          text: qBank ? qBank.question : '',
          candidateAnswer: resp.answer || '',
          aiScore: resp.aiScore || 0,
          aiFeedback: resp.feedback || '',
        };
      });

      res.json({
        message: 'Interview session started successfully.',
        sessionId,
        mode,
        questions: questionsList,
        firstQuestion: questionsList[0].text,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /interview/:id/answer
 */
router.post(
  '/:id/answer',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { sessionId, questionId, textAnswer } = req.body;

      if (!sessionId || !questionId) {
        throw new AppError('sessionId and questionId are required.', 400, 'VALIDATION_ERROR');
      }

      const interview = await Interview.findById(id);
      if (!interview) {
        throw new AppError('Interview not found.', 404, 'NOT_FOUND');
      }

      const application = await Application.findById(interview.applicationId);
      if (!application) {
        throw new AppError('Associated application not found.', 404, 'NOT_FOUND');
      }

      const candidate = await Candidate.findById(application.candidateId);
      if (!candidate || candidate.userId.toString() !== req.user!._id.toString()) {
        throw new AppError('You do not have access to this interview.', 403, 'FORBIDDEN');
      }

      const currentQuestion = await QuestionResponse.findById(questionId).populate('questionId');
      if (!currentQuestion) {
        throw new AppError('Question not found in this interview.', 400, 'NOT_FOUND');
      }

      // 1. Get transcript — text-mode uses textAnswer directly, avatar-mode calls avatar-service
      const avatarServiceUrl = process.env.AVATAR_SERVICE_URL || 'http://localhost:5002';
      let transcript = '';
      let transcriptionFailed = false;
      if (textAnswer && typeof textAnswer === 'string' && textAnswer.trim().length > 0) {
        // Text-mode: candidate typed their answer directly
        transcript = textAnswer.trim();
      } else {
        // Avatar-mode: try to get transcription from avatar-service
        try {
          const listenRes = await axios.post(
            `${avatarServiceUrl}/avatar/listen`,
            { sessionId },
            { timeout: 60000 }
          );
          transcript = (listenRes.data.transcript || '').trim();
          transcriptionFailed =
            Boolean(listenRes.data.transcriptionFailed) || transcript.length === 0;
        } catch (err: any) {
          logger.warn(`[Interview] Avatar listen failed: ${err.message}. No transcript captured.`);
          transcript = '';
          transcriptionFailed = true;
        }
      }

      // If voice transcription failed, do not fabricate an answer or score. Ask the
      // candidate to retry (or switch to text mode) instead of silently recording
      // an empty/AI-scored response.
      if (transcriptionFailed) {
        throw new AppError(
          'We could not hear your answer clearly. Please try recording again, or switch to text mode.',
          422,
          'TRANSCRIPTION_FAILED'
        );
      }

      // Save transcript
      currentQuestion.answer = transcript;

      // 2. Fetch Job Details for context-aware scoring
      const job = await JobPosting.findById(application.jobId);
      if (!job) {
        throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
      }

      const qBank: any = currentQuestion.questionId;
      const questionText = qBank ? qBank.question : 'Interview Question';
      const expectedAnswerGuideline = `The candidate should provide a professional response demonstrating knowledge or experience related to the question: '${questionText}'. Key aspects: relevant to a ${job.title} role, addressing required skills: ${(job.skillsRequired || []).join(', ')}.`;

      // 3. Call python-ai evaluate-answer endpoint
      const pythonAiUrl = process.env.PYTHON_AI_URL || 'http://localhost:8002';
      let aiScore = 5;
      let aiFeedback = 'Response recorded successfully.';

      try {
        const evalRes = await axios.post(`${pythonAiUrl}/evaluate-answer`, {
          question: questionText,
          expectedAnswer: expectedAnswerGuideline,
          candidateAnswer: transcript,
        });

        aiScore = evalRes.data.overall_score;
        aiFeedback = evalRes.data.feedback;
      } catch (err: any) {
        logger.warn(
          `[Interview] Failed to evaluate answer via python-ai: ${err.message}. Falling back to default scoring.`
        );
      }

      currentQuestion.aiScore = aiScore;
      currentQuestion.feedback = aiFeedback;
      currentQuestion.confidence = 80; // default confidence

      await currentQuestion.save();

      // Check if there is a next question
      const nextIndex = currentQuestion.questionOrder + 1;
      const nextQuestion = await QuestionResponse.findOne({
        interviewId: interview._id,
        questionOrder: nextIndex,
      }).populate('questionId');

      if (nextQuestion) {
        const nextQBank: any = nextQuestion.questionId;
        const nextQuestionText = nextQBank ? nextQBank.question : 'Next Question';
        try {
          await axios.post(`${avatarServiceUrl}/avatar/ask`, {
            sessionId,
            questionText: nextQuestionText,
          });
        } catch (err: any) {
          logger.warn(`[Interview] Failed to push next question to avatar-service: ${err.message}`);
        }

        res.json({
          transcript,
          nextQuestion: nextQuestionText,
          nextQuestionId: nextQuestion._id.toString(),
          currentQuestionIndex: nextIndex - 1,
          done: false,
        });
      } else {
        // End the avatar session
        try {
          await axios.post(`${avatarServiceUrl}/avatar/session/end`, { sessionId });
        } catch (err: any) {
          logger.debug(`[Interview] Could not end avatar session: ${err.message}`);
        }

        // Compute avgInterviewScore (0-10 scale)
        const allResponses = await QuestionResponse.find({ interviewId: interview._id });
        const totalScore = allResponses.reduce((sum, q) => sum + (q.aiScore || 0), 0);
        const avgInterviewScore = totalScore / Math.max(1, allResponses.length);
        const overallInterviewScore = Math.round(avgInterviewScore * 10); // Normalize to 0-100

        // Fetch resume analysis to get atsScore
        const resumeAnalysis = await ResumeAnalysis.findOne({ applicationId: application._id });
        const atsScore = resumeAnalysis ? resumeAnalysis.atsScore : 70;
        const finalWeightedScore = Math.round(atsScore * 0.3 + overallInterviewScore * 0.7);

        // Perform holistic evaluation using Gemini API key
        let technicalScore = overallInterviewScore;
        let communicationScore = overallInterviewScore;
        let problemSolvingScore = overallInterviewScore;
        let grammarScore = overallInterviewScore;
        let behavioralScore = overallInterviewScore;
        let confidenceScore = overallInterviewScore;
        let feedback =
          'The candidate completed the automated avatar interview and responded to all questions.';
        let recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire' =
          'maybe';

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const holisticPrompt = `You are a senior recruiter evaluating a candidate's full interview performance.
Job Title: "${job.title}"
Job Description: "${job.description}"

Here is the transcript of the interview with questions and candidate answers:
${allResponses
  .map((q, idx) => {
    const qb: any = q.questionId;
    return `Q${idx + 1}: ${qb ? qb.question : ''}\nCandidate Answer: ${q.answer || ''}\nAI Feedback: ${q.feedback || ''}`;
  })
  .join('\n\n')}

Provide a comprehensive evaluation. Return ONLY a valid JSON object matching this schema (do NOT include markdown formatting or code blocks):
{
  "technicalScore": number 0-100,
  "communicationScore": number 0-100,
  "problemSolvingScore": number 0-100,
  "grammarScore": number 0-100,
  "behavioralScore": number 0-100,
  "confidenceScore": number 0-100,
  "feedback": string,
  "recommendation": "strong_hire" | "hire" | "maybe" | "no_hire" | "strong_no_hire"
}`;

          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const evalResponse = await axios.post(url, {
              contents: [{ parts: [{ text: holisticPrompt }] }],
            });

            let evalText = evalResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            evalText = evalText
              .replace(/```json/gi, '')
              .replace(/```/g, '')
              .trim();
            const parsedEval = JSON.parse(evalText);

            technicalScore =
              typeof parsedEval.technicalScore === 'number'
                ? parsedEval.technicalScore
                : technicalScore;
            communicationScore =
              typeof parsedEval.communicationScore === 'number'
                ? parsedEval.communicationScore
                : communicationScore;
            problemSolvingScore =
              typeof parsedEval.problemSolvingScore === 'number'
                ? parsedEval.problemSolvingScore
                : problemSolvingScore;
            grammarScore =
              typeof parsedEval.grammarScore === 'number' ? parsedEval.grammarScore : grammarScore;
            behavioralScore =
              typeof parsedEval.behavioralScore === 'number'
                ? parsedEval.behavioralScore
                : behavioralScore;
            confidenceScore =
              typeof parsedEval.confidenceScore === 'number'
                ? parsedEval.confidenceScore
                : confidenceScore;
            feedback = parsedEval.feedback || feedback;
            if (
              ['strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire'].includes(
                parsedEval.recommendation
              )
            ) {
              recommendation = parsedEval.recommendation;
            }
          } catch (err: any) {
            logger.warn(
              `[Interview] Failed to run holistic evaluation: ${err.message}. Using default parameters.`
            );
          }
        }

        // Create InterviewEvaluation document
        await InterviewEvaluation.create({
          interviewId: interview._id,
          technicalScore,
          communicationScore,
          confidenceScore,
          grammarScore,
          problemSolvingScore,
          behavioralScore,
          overallScore: overallInterviewScore,
          recommendation,
          feedback,
        });

        // Update interview status to evaluated/completed via results
        interview.overallScore = overallInterviewScore;
        const isRejected = recommendation.includes('no_hire');
        interview.result = isRejected ? 'rejected' : 'selected';
        await interview.save();

        // Update application status
        application.status = isRejected ? 'rejected' : 'interviewed';
        if (isRejected) {
          application.rejectionReason = `Rejected based on interview evaluation. Feedback: ${feedback}`;
        }
        await application.save();

        // Fire N8N_WEBHOOK_RESUME_REJECTED if rejected
        if (isRejected) {
          const rejectWebhookUrl = process.env.N8N_WEBHOOK_RESUME_REJECTED;
          if (rejectWebhookUrl) {
            try {
              const candidateUser = await User.findById(candidate.userId);
              await axios.post(
                rejectWebhookUrl,
                {
                  candidateId: candidate._id.toString(),
                  candidateEmail: candidateUser?.email || '',
                  candidateName: candidate.name,
                  applicationId: application._id.toString(),
                  atsScore: atsScore,
                  rejectionReason: `Rejected based on interview evaluation. Feedback: ${feedback}`,
                },
                { timeout: 5000 }
              );
              logger.info(
                `[Interview] N8N interview rejection webhook fired for application ${application._id}`
              );
            } catch (webhookErr: any) {
              logger.warn(
                `[Interview] N8N interview rejection webhook failed to fire: ${webhookErr.message}`
              );
            }
          }
        }

        // Fire N8N_WEBHOOK_INTERVIEW_COMPLETE
        const completeWebhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_COMPLETE;
        if (completeWebhookUrl) {
          try {
            const hr = await Hr.findById(job.hrId);
            const hrUser = hr ? await User.findById(hr.userId) : null;
            const candidateUser = await User.findById(candidate.userId);

            await axios.post(
              completeWebhookUrl,
              {
                candidateId: candidate._id.toString(),
                candidateName: candidate.name,
                candidateEmail: candidateUser?.email || '',
                applicationId: application._id.toString(),
                interviewId: interview._id.toString(),
                overallInterviewScore,
                atsScore,
                finalWeightedScore,
                recommendation,
                jobTitle: job.title,
                hrEmail: hrUser?.email || '',
              },
              { timeout: 5000 }
            );
            logger.info(
              `[Interview] N8N interview-complete webhook fired for application ${application._id}`
            );
          } catch (webhookErr: any) {
            logger.warn(
              `[Interview] N8N interview-complete webhook failed to fire: ${webhookErr.message}`
            );
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
