import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
import {
  Resume,
  ResumeAnalysis,
  Application,
  JobPosting,
  Notification,
  Candidate,
  Hr,
} from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import { AppError } from '../utils/errors';
import logger from '../lib/logger';
import { autoScheduleInterview } from '../utils/autoSchedule';

const router = Router();

const maxResumeSizeMb = Number(process.env.MAX_RESUME_SIZE_MB) || 5;
const maxSizeBytes = maxResumeSizeMb * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new AppError('Only PDF files are allowed.', 400, 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

/**
 * POST /resume
 * Multipart form: resume (File, PDF only)
 */
router.post(
  '/',
  requireAuth,
  requireRole('candidate'),
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('resume')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(
              new AppError(
                `File size exceeds the limit of ${maxResumeSizeMb}MB.`,
                400,
                'FILE_TOO_LARGE'
              )
            );
          }
        }
        return next(err);
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No resume file was uploaded.', 400, 'MISSING_FILE');
      }

      const candidate = await Candidate.findOne({ userId: req.user!._id });
      if (!candidate) {
        throw new AppError('Candidate profile not found.', 404, 'NOT_FOUND');
      }

      const resumeUrl = await uploadToCloudinary(req.file.buffer, 'resumes', 'raw');

      const resume = await Resume.create({
        candidateId: candidate._id,
        resumeUrl,
        strengths: [],
        weaknesses: [],
        suggestions: [],
        uploadDate: new Date(),
      });

      res.status(201).json(resume);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /resume/mine
 */
router.get(
  '/mine',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const candidate = await Candidate.findOne({ userId: req.user!._id });
      if (!candidate) {
        res.json([]);
        return;
      }
      const resumes = await Resume.find({ candidateId: candidate._id }).sort({ uploadDate: -1 });
      res.json(resumes);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /resume/:id/analyze
 */
router.post(
  '/:id/analyze',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8002';

      // 1. Find the resume
      const resume = await Resume.findById(id);
      if (!resume) {
        throw new AppError('Resume not found.', 404, 'NOT_FOUND');
      }

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }
      if (!hr.companyId) {
        throw new AppError(
          'Please complete your company profile before analyzing resumes.',
          400,
          'COMPANY_REQUIRED'
        );
      }

      // 2. Find the application linked to this resume
      const application = await Application.findOne({
        candidateId: resume.candidateId,
        resumeId: resume._id,
      });

      // 3. Find the job posting to get description + required skills
      let jobDescription = '';
      let requiredSkills: string[] = [];
      let jobObj: any = null;

      if (application) {
        const job = await JobPosting.findById(application.jobId);
        if (job) {
          if (job.companyId.toString() !== hr.companyId.toString()) {
            throw new AppError(
              'You do not have permission to modify this job posting.',
              403,
              'FORBIDDEN'
            );
          }
          jobObj = job;
          jobDescription = `${job.title}\n${job.description}`;
          requiredSkills = job.skillsRequired || [];
        }
      }

      // 4. Call python-ai POST /parse-resume
      logger.info(`[Analyze] Calling python-ai /parse-resume for resume ${id}`);
      let parseResult: { extractedText: string; sections: Record<string, string[]> };
      try {
        const parseRes = await axios.post(
          `${PYTHON_AI_URL}/parse-resume`,
          {
            resumeUrl: resume.resumeUrl,
          },
          { timeout: 30000 }
        );
        parseResult = parseRes.data;
      } catch (err: any) {
        const msg =
          err.response?.data?.detail?.error?.message || err.message || 'Parse service failed.';
        logger.error(`[Analyze] Parse failed: ${msg}`);
        throw new AppError(`Resume parsing failed: ${msg}`, 502, 'PARSE_FAILED');
      }

      // 5. Store extractedText on the resume document
      resume.extractedText = parseResult.extractedText;
      await resume.save();

      // 6. Call python-ai POST /analyze-resume
      logger.info(`[Analyze] Calling python-ai /analyze-resume for resume ${id}`);
      let analyzeResult: {
        ats_score: number;
        matched_skills: string[];
        missing_skills: string[];
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
      };
      try {
        const analyzeRes = await axios.post(
          `${PYTHON_AI_URL}/analyze-resume`,
          {
            resumeText: parseResult.extractedText,
            jobDescription: jobDescription || 'General software engineering position.',
            requiredSkills:
              requiredSkills.length > 0 ? requiredSkills : parseResult.sections.skills || [],
          },
          { timeout: 60000 }
        );
        analyzeResult = analyzeRes.data;
      } catch (err: any) {
        const msg =
          err.response?.data?.detail?.error?.message || err.message || 'Analyze service failed.';
        logger.error(`[Analyze] Analyze failed: ${msg}`);
        throw new AppError(`Resume analysis failed: ${msg}`, 502, 'ANALYZE_FAILED');
      }

      // Calculate auxiliary scores for the ResumeAnalysis SCHEMA-OF-RECORD compliance
      const ats = analyzeResult.ats_score;
      const skillMatch = Math.round(
        (analyzeResult.matched_skills.length /
          Math.max(1, analyzeResult.matched_skills.length + analyzeResult.missing_skills.length)) *
          100
      );
      const grammarScore = Math.max(70, Math.min(95, Math.round(ats * 1.05)));
      const experienceScore = Math.max(50, Math.min(98, Math.round(ats * 0.95)));
      const educationScore = Math.max(60, Math.min(95, Math.round(ats * 0.9)));

      // 7. Create ResumeAnalysis document
      const analysis = await ResumeAnalysis.create({
        resumeId: resume._id,
        applicationId: application?._id,
        atsScore: ats,
        grammarScore,
        skillMatch,
        experienceScore,
        educationScore,
        matchedSkills: analyzeResult.matched_skills,
        missingSkills: analyzeResult.missing_skills,
        strengths: analyzeResult.strengths,
        weaknesses: analyzeResult.weaknesses,
        recommendations: analyzeResult.recommendations,
      });

      // 8. Denormalize atsScore and breakdowns onto the resume document
      resume.atsScore = ats;
      resume.strengths = analyzeResult.strengths;
      resume.weaknesses = analyzeResult.weaknesses;
      resume.suggestions = analyzeResult.recommendations;
      await resume.save();

      // 9. Manual vs Automatic Decision Gate Control
      let autoScreenEnabled = false;
      let atsCutoffScore = 60;
      if (application) {
        const job = await JobPosting.findById(application.jobId);
        autoScreenEnabled = job?.autoScreenEnabled ?? false;
        atsCutoffScore = job?.atsCutoffScore ?? 60;

        // Denormalize scores onto the core application object for rendering
        application.atsScore = analyzeResult.ats_score;
        application.atsAnalysis = {
          overallScore: analyzeResult.ats_score,
          matchedSkills: analyzeResult.matched_skills,
          missingSkills: analyzeResult.missing_skills,
          experienceMatch: 0,
          educationMatch: 0,
          strengths: analyzeResult.strengths,
          weaknesses: analyzeResult.weaknesses,
          recommendations: analyzeResult.recommendations,
        };

        if (autoScreenEnabled) {
          if (analyzeResult.ats_score < atsCutoffScore) {
            // AUTOMATIC MODE: System Auto-Rejects if flagged under threshold
            application.status = 'rejected';
            application.rejectionReason = `Automated screening check: ATS Score (${analyzeResult.ats_score}) below job requirements threshold (${atsCutoffScore}).`;
            await application.save();

            // Fire webhook trigger safely
            const webhookUrl = process.env.N8N_WEBHOOK_RESUME_REJECTED;
            if (webhookUrl) {
              try {
                const candidate = await Candidate.findById(resume.candidateId).populate('userId');
                if (candidate) {
                  const userObj: any = candidate.userId;
                  await axios.post(
                    webhookUrl,
                    {
                      candidateId: resume.candidateId.toString(),
                      candidateEmail: userObj ? userObj.email : '',
                      candidateName: candidate.name,
                      applicationId: application._id.toString(),
                      atsScore: analyzeResult.ats_score,
                    },
                    { timeout: 5000 }
                  );
                  logger.info(
                    `[Analyze] N8N webhook fired: resume-rejected for application ${application._id}`
                  );
                }
              } catch (err: any) {
                logger.warn(`Webhook failed: ${err.message}`);
              }
            }
          } else {
            // AUTOMATIC MODE: System Auto-Shortlists and Auto-Schedules if passing
            application.status = 'shortlisted';
            await application.save();

            const hrUserEmail = req.user!.email;
            const hrUserId = req.user!._id;
            autoScheduleInterview(
              application._id.toString(),
              hrUserId.toString(),
              hrUserEmail
            ).catch((err) => {
              logger.error(`[Analyze] Auto-schedule error: ${err.message}`);
            });
          }
        } else {
          // MANUAL MODE: Always leave as applied/under_review so HR has control buttons
          application.status = 'under_review';
          await application.save();

          if (job) {
            // Find the HR user for notification
            const hrObj = await Hr.findOne({ companyId: job.companyId });
            if (hrObj) {
              await Notification.create({
                userId: hrObj.userId,
                title: 'New Candidate Profile Evaluated',
                message: `Application for "${job.title}" analyzed with an ATS rating of ${analyzeResult.ats_score}. Manual decision ready.`,
                type: 'application_update',
                link: `/hr/applications/${application._id}`,
              });
            }
          }
        }
      }

      res.json({
        message: 'Resume analysis complete.',
        resumeId: resume._id,
        applicationId: application?._id || null,
        atsScore: ats,
        decision: application
          ? autoScreenEnabled && ats < atsCutoffScore
            ? 'rejected'
            : 'under_review'
          : 'no_application',
        analysis,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /resume/:id/view
 * Streams the resume PDF back to the browser with an inline Content-Disposition so
 * it opens in the browser's PDF viewer instead of downloading. Accessible to the
 * owning candidate and to any HR whose company received an application with this
 * resume. Requires the Authorization header; the client fetches it as a blob and
 * opens it in a new tab, so the JWT never appears in the URL.
 */
router.get(
  '/:id/view',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const resume = await Resume.findById(id);
      if (!resume) {
        throw new AppError('Resume not found.', 404, 'NOT_FOUND');
      }

      // ── Authorization ──
      let authorized = false;
      if (req.user!.role === 'candidate') {
        const candidate = await Candidate.findOne({ userId: req.user!._id });
        authorized = Boolean(
          candidate && candidate._id.toString() === resume.candidateId.toString()
        );
      } else if (req.user!.role === 'hr') {
        const hr = await Hr.findOne({ userId: req.user!._id });
        if (hr && hr.companyId) {
          const companyJobs = await JobPosting.find({ companyId: hr.companyId }).select('_id');
          const companyJobIds = companyJobs.map((j) => j._id);
          const linkingApplication = await Application.findOne({
            candidateId: resume.candidateId,
            jobId: { $in: companyJobIds },
          });
          authorized = Boolean(linkingApplication);
        }
      }

      if (!authorized) {
        throw new AppError('You do not have permission to view this resume.', 403, 'FORBIDDEN');
      }

      // Guard against the Cloudinary mock URL fallback (returned when Cloudinary
      // is not configured) which points at a non-existent file.
      if (!resume.resumeUrl || resume.resumeUrl.includes('res.cloudinary.com/mock-cloud')) {
        throw new AppError(
          'The stored resume file is unavailable (upload storage is not configured).',
          502,
          'FILE_UNAVAILABLE'
        );
      }

      // Stream the PDF from its stored location and force inline rendering.
      try {
        const fileRes = await axios.get(resume.resumeUrl, {
          responseType: 'stream',
          timeout: 30000,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
        const contentLength = fileRes.headers['content-length'];
        if (typeof contentLength === 'string' || typeof contentLength === 'number') {
          res.setHeader('Content-Length', contentLength);
        }
        fileRes.data.pipe(res);
      } catch (err: any) {
        logger.error(`[Resume] Failed to stream resume ${id}: ${err.message}`);
        throw new AppError('Failed to load the resume file.', 502, 'FILE_FETCH_FAILED');
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /resume/:id
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const candidate = await Candidate.findOne({ userId: req.user!._id });
      if (!candidate) {
        throw new AppError('Candidate profile not found.', 404, 'NOT_FOUND');
      }

      const resume = await Resume.findOne({ _id: id, candidateId: candidate._id });
      if (!resume) {
        throw new AppError('Resume not found or not owned by you.', 404, 'NOT_FOUND');
      }

      await Resume.deleteOne({ _id: id });
      res.json({ message: 'Resume deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
