import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
import { Resume, ResumeAnalysis, Application, JobPosting, Notification, User } from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import { AppError } from '../utils/errors';
import logger from '../lib/logger';

const router = Router();

// Retrieve maximum resume size limit from environment
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
 * Uploads a candidate's resume to Cloudinary and saves the record in the database.
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

      // Upload to Cloudinary with resourceType: 'raw' to receive a working downloadable PDF URL
      const resumeUrl = await uploadToCloudinary(req.file.buffer, 'resumes', 'raw');

      const resume = await Resume.create({
        candidateId: req.user!._id,
        resumeUrl,
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
 * Lists all resumes belonging to the currently logged-in candidate.
 */
router.get(
  '/mine',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resumes = await Resume.find({ candidateId: req.user!._id }).sort({ uploadDate: -1 });
      res.json(resumes);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /resume/:id/analyze
 * HR or system-triggered. Calls python-ai /parse-resume and /analyze-resume in sequence,
 * stores results, and applies the decision gate.
 */
router.post(
  '/:id/analyze',
  requireAuth,
  requireRole('hr', 'admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8002';

      // 1. Find the resume
      const resume = await Resume.findById(id);
      if (!resume) {
        throw new AppError('Resume not found.', 404, 'NOT_FOUND');
      }

      // 2. Find the application linked to this resume (if one exists)
      //    Look for an application where this candidate applied with this resume URL
      const application = await Application.findOne({
        candidateId: resume.candidateId,
        resumePath: resume.resumeUrl,
      });

      // 3. Find the job posting to get description + required skills
      let jobDescription = '';
      let requiredSkills: string[] = [];

      if (application) {
        const job = await JobPosting.findById(application.jobId);
        if (job) {
          jobDescription = `${job.title}\n${job.description}`;
          requiredSkills = job.skills || [];
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

      // 7. Create ResumeAnalysis document (source of truth for full breakdown)
      const analysis = await ResumeAnalysis.create({
        resumeId: resume._id,
        applicationId: application?._id,
        atsScore: analyzeResult.ats_score,
        matchedSkills: analyzeResult.matched_skills,
        missingSkills: analyzeResult.missing_skills,
        strengths: analyzeResult.strengths,
        weaknesses: analyzeResult.weaknesses,
        recommendations: analyzeResult.recommendations,
      });

      // 8. Denormalize atsScore back onto the resume document
      resume.atsScore = analyzeResult.ats_score;
      await resume.save();

      // 9. Decision gate (only if there is a linked application)
      if (application) {
        const ATS_THRESHOLD = 60;

        if (analyzeResult.ats_score < ATS_THRESHOLD) {
          // ── REJECT ──
          application.status = 'rejected';
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
          await application.save();

          // Fire N8N_WEBHOOK_RESUME_REJECTED (stub placeholder)
          const webhookUrl = process.env.N8N_WEBHOOK_RESUME_REJECTED;
          if (webhookUrl) {
            try {
              const candidate = await User.findById(resume.candidateId);
              if (candidate) {
                await axios.post(
                  webhookUrl,
                  {
                    candidateId: resume.candidateId.toString(),
                    candidateEmail: candidate.email,
                    candidateName: candidate.fullName,
                    applicationId: application._id.toString(),
                    atsScore: analyzeResult.ats_score,
                    weaknesses: analyzeResult.weaknesses,
                    recommendations: analyzeResult.recommendations,
                  },
                  { timeout: 5000 }
                );
                logger.info(
                  `[Analyze] N8N webhook fired: resume-rejected for application ${application._id}`
                );
              }
            } catch (webhookErr: any) {
              // Don't crash the process — just log the failure
              logger.warn(`[Analyze] N8N webhook (resume-rejected) failed: ${webhookErr.message}`);
            }
          }

          logger.info(
            `[Analyze] Application ${application._id} REJECTED (ATS score: ${analyzeResult.ats_score})`
          );
        } else {
          // ── UNDER REVIEW ──
          application.status = 'under_review';
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
          await application.save();

          // Create notification for the owning HR
          const job = await JobPosting.findById(application.jobId);
          if (job) {
            await Notification.create({
              userId: job.postedBy,
              title: 'New application to review',
              message: `A new application for "${job.title}" has passed ATS screening (score: ${analyzeResult.ats_score}). Review it in your dashboard.`,
              type: 'application_update',
              link: `/hr/applications/${application._id}`,
            });
            logger.info(
              `[Analyze] Notification created for HR ${job.postedBy} — application ${application._id} under review`
            );
          }

          logger.info(
            `[Analyze] Application ${application._id} moved to UNDER_REVIEW (ATS score: ${analyzeResult.ats_score})`
          );
        }
      }

      res.json({
        message: 'Resume analysis complete.',
        resumeId: resume._id,
        applicationId: application?._id || null,
        atsScore: analyzeResult.ats_score,
        decision: application
          ? analyzeResult.ats_score < 60
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

export default router;
