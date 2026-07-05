import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { Application, JobPosting, Resume, User, Company } from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/errors';
import logger from '../lib/logger';

const router = Router();

/**
 * POST /application
 * Body: { jobId, resumeId }
 * Submits an application for the logged-in candidate to a specific job listing.
 */
router.post(
  '/',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { jobId, resumeId } = req.body;

      if (!jobId || !resumeId) {
        throw new AppError('jobId and resumeId are required.', 400, 'VALIDATION_ERROR');
      }

      // 1. Verify job is active
      const job = await JobPosting.findById(jobId);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }
      if (job.status !== 'active') {
        throw new AppError(
          'This job posting is not accepting applications.',
          400,
          'JOB_NOT_ACTIVE'
        );
      }

      // 2. Verify resume belongs to the candidate
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        throw new AppError('Resume not found.', 404, 'NOT_FOUND');
      }
      if (resume.candidateId.toString() !== req.user!._id.toString()) {
        throw new AppError('This resume does not belong to you.', 403, 'FORBIDDEN');
      }

      // 3. Verify no existing application
      const existing = await Application.findOne({ jobId, candidateId: req.user!._id });
      if (existing) {
        throw new AppError('You have already applied for this job.', 409, 'ALREADY_APPLIED');
      }

      // 4. Create the application
      const application = await Application.create({
        jobId,
        candidateId: req.user!._id,
        resumePath: resume.resumeUrl,
        status: 'applied',
      });

      res.status(201).json(application);
    } catch (error: any) {
      if (error.code === 11000) {
        next(new AppError('You have already applied for this job.', 409, 'ALREADY_APPLIED'));
      } else {
        next(error);
      }
    }
  }
);

/**
 * GET /application/mine
 * Retrieves all applications submitted by the logged-in candidate.
 */
router.get(
  '/mine',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applications = await Application.find({ candidateId: req.user!._id })
        .populate({
          path: 'jobId',
          select: 'title department location companyId',
          populate: {
            path: 'companyId',
            select: 'name logoUrl',
          },
        })
        .sort({ createdAt: -1 });

      res.json(applications);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /application
 * Restricted to HR. Returns all candidate applications submitted for jobs posted by this HR.
 */
router.get(
  '/',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs = await JobPosting.find({ postedBy: req.user!._id });
      const jobIds = jobs.map((j) => j._id);

      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('candidateId', 'fullName email phone')
        .populate('jobId', 'title department location')
        .sort({ createdAt: -1 });

      res.json(applications);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /application/:id
 * Retrieve specific application details (with candidate ownership check).
 */
router.get(
  '/:id',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const application = await Application.findById(id).populate({
        path: 'jobId',
        select:
          'title department location locationType employmentType salaryMax description companyId',
        populate: {
          path: 'companyId',
          select: 'name logoUrl website industry',
        },
      });

      if (!application) {
        throw new AppError('Application not found.', 404, 'NOT_FOUND');
      }

      // Ownership check: must be candidate's own application
      if (application.candidateId.toString() !== req.user!._id.toString()) {
        throw new AppError(
          'You do not have permission to view this application.',
          403,
          'FORBIDDEN'
        );
      }

      res.json(application);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /application/:id/status
 * Body: { status: 'shortlisted' | 'rejected' }
 * Restricts updates to the HR who posted the corresponding job posting.
 */
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['shortlisted', 'rejected'].includes(status)) {
        throw new AppError('Status must be shortlisted or rejected.', 400, 'VALIDATION_ERROR');
      }

      const application = await Application.findById(id);
      if (!application) {
        throw new AppError('Application not found.', 404, 'NOT_FOUND');
      }

      const job = await JobPosting.findById(application.jobId);
      if (!job) {
        throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
      }

      // Check if current HR is the one who posted the job
      if (job.postedBy.toString() !== req.user!._id.toString()) {
        throw new AppError(
          'You do not have permission to update the status of this application.',
          403,
          'FORBIDDEN'
        );
      }

      application.status = status;
      await application.save();

      res.json({
        message: `Application status updated to ${status}.`,
        application,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /application/:id/send-offer
 * Triggers sending an offer email to the candidate. Restricted to the HR owning the job.
 */
router.post(
  '/:id/send-offer',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const application = await Application.findById(id);
      if (!application) {
        throw new AppError('Application not found.', 404, 'NOT_FOUND');
      }

      const job = await JobPosting.findById(application.jobId);
      if (!job) {
        throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
      }

      // Check HR ownership
      if (job.postedBy.toString() !== req.user!._id.toString()) {
        throw new AppError(
          'You do not have permission to send an offer for this application.',
          403,
          'FORBIDDEN'
        );
      }

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

      // Update status to offered
      application.status = 'offered';
      await application.save();

      // Trigger N8N offer webhook
      const webhookUrl = process.env.N8N_WEBHOOK_OFFER;
      if (webhookUrl) {
        try {
          await axios.post(
            webhookUrl,
            {
              candidateId: candidate._id.toString(),
              candidateEmail: candidate.email,
              candidateName: candidate.fullName,
              jobTitle: job.title,
              companyName,
            },
            { timeout: 5000 }
          );
          logger.info(`[Application] N8N offer webhook fired for application ${application._id}`);
        } catch (webhookErr: any) {
          logger.warn(`[Application] N8N offer webhook failed to fire: ${webhookErr.message}`);
        }
      } else {
        logger.warn('[Application] N8N_WEBHOOK_OFFER is not configured.');
      }

      res.json({
        message: 'Offer sent and application status updated to offered.',
        application,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
