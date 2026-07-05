import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { Application, JobPosting, Resume, User, Company, Candidate, Hr } from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/errors';
import logger from '../lib/logger';

const router = Router();

/**
 * POST /application
 * Body: { jobId, resumeId }
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

      const candidate = await Candidate.findOne({ userId: req.user!._id });
      if (!candidate) {
        throw new AppError('Candidate profile not found.', 404, 'NOT_FOUND');
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
      if (resume.candidateId.toString() !== candidate._id.toString()) {
        throw new AppError('This resume does not belong to you.', 403, 'FORBIDDEN');
      }

      // 3. Verify no existing application
      const existing = await Application.findOne({ jobId, candidateId: candidate._id });
      if (existing) {
        throw new AppError('You have already applied for this job.', 409, 'ALREADY_APPLIED');
      }

      // 4. Create the application
      const application = await Application.create({
        jobId,
        candidateId: candidate._id,
        resumeId: resume._id,
        status: 'applied',
        appliedOn: new Date(),
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

      const applications = await Application.find({ candidateId: candidate._id })
        .populate({
          path: 'jobId',
          select: 'title domain location companyId',
          populate: {
            path: 'companyId',
            select: 'companyName logo',
          },
        })
        .sort({ appliedOn: -1 });

      const response = applications.map((app) => {
        const jobObj: any = app.jobId;
        const companyObj: any = jobObj ? jobObj.companyId : null;
        return {
          _id: app._id,
          status: app.status,
          appliedOn: app.appliedOn,
          createdAt: app.appliedOn,
          jobId: jobObj ? {
            _id: jobObj._id,
            title: jobObj.title,
            domain: jobObj.domain,
            department: jobObj.domain,
            location: jobObj.location,
            companyId: companyObj ? {
              _id: companyObj._id,
              name: companyObj.companyName,
              companyName: companyObj.companyName,
              logoUrl: companyObj.logo,
              logo: companyObj.logo,
            } : null,
          } : null,
        };
      });

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /application
 */
router.get(
  '/',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }

      const jobs = await JobPosting.find({ hrId: hr._id });
      const jobIds = jobs.map((j) => j._id);

      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate({
          path: 'candidateId',
          populate: {
            path: 'userId',
            select: 'email',
          },
        })
        .populate({
          path: 'jobId',
          select: 'title domain location companyId',
          populate: {
            path: 'companyId',
            select: 'companyName logo',
          },
        })
        .sort({ appliedOn: -1 });

      const response = applications.map((app) => {
        const cand: any = app.candidateId;
        const jobObj: any = app.jobId;
        const companyObj: any = jobObj ? jobObj.companyId : null;
        const userObj: any = cand ? cand.userId : null;
        return {
          _id: app._id,
          status: app.status,
          appliedOn: app.appliedOn,
          createdAt: app.appliedOn,
          candidateId: cand ? {
            _id: cand._id,
            fullName: cand.name,
            name: cand.name,
            email: userObj ? userObj.email : '',
            phone: cand.phone || '',
          } : null,
          jobId: jobObj ? {
            _id: jobObj._id,
            title: jobObj.title,
            domain: jobObj.domain,
            department: jobObj.domain,
            location: jobObj.location,
            companyId: companyObj ? {
              _id: companyObj._id,
              name: companyObj.companyName,
              companyName: companyObj.companyName,
              logoUrl: companyObj.logo,
              logo: companyObj.logo,
            } : null,
          } : null,
        };
      });

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /application/:id
 */
router.get(
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

      const application = await Application.findById(id).populate({
        path: 'jobId',
        select: 'title domain location description companyId',
        populate: {
          path: 'companyId',
          select: 'companyName logo website industry',
        },
      });

      if (!application) {
        throw new AppError('Application not found.', 404, 'NOT_FOUND');
      }

      // Ownership check: must be candidate's own application
      if (application.candidateId.toString() !== candidate._id.toString()) {
        throw new AppError(
          'You do not have permission to view this application.',
          403,
          'FORBIDDEN'
        );
      }

      const jobObj: any = application.jobId;
      const companyObj: any = jobObj ? jobObj.companyId : null;

      const response = {
        _id: application._id,
        status: application.status,
        appliedOn: application.appliedOn,
        createdAt: application.appliedOn,
        jobId: jobObj ? {
          _id: jobObj._id,
          title: jobObj.title,
          domain: jobObj.domain,
          department: jobObj.domain,
          location: jobObj.location,
          description: jobObj.description,
          companyId: companyObj ? {
            _id: companyObj._id,
            name: companyObj.companyName,
            companyName: companyObj.companyName,
            logoUrl: companyObj.logo,
            logo: companyObj.logo,
            website: companyObj.website,
            industry: companyObj.industry,
          } : null,
        } : null,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /application/:id/status
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

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
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
      if (job.hrId.toString() !== hr._id.toString()) {
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
 */
router.post(
  '/:id/send-offer',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }

      const application = await Application.findById(id);
      if (!application) {
        throw new AppError('Application not found.', 404, 'NOT_FOUND');
      }

      const job = await JobPosting.findById(application.jobId);
      if (!job) {
        throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
      }

      // Check HR ownership
      if (job.hrId.toString() !== hr._id.toString()) {
        throw new AppError(
          'You do not have permission to send an offer for this application.',
          403,
          'FORBIDDEN'
        );
      }

      const candidate = await Candidate.findById(application.candidateId).populate('userId');
      if (!candidate) {
        throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
      }

      let companyName = 'Our Company';
      if (job.companyId) {
        const company = await Company.findById(job.companyId);
        if (company) {
          companyName = company.companyName;
        }
      }

      // Update status to selected
      application.status = 'selected';
      await application.save();

      // Trigger N8N offer webhook
      const webhookUrl = process.env.N8N_WEBHOOK_OFFER;
      if (webhookUrl) {
        try {
          const userObj: any = candidate.userId;
          await axios.post(
            webhookUrl,
            {
              candidateId: candidate._id.toString(),
              candidateEmail: userObj ? userObj.email : '',
              candidateName: candidate.name,
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
        message: 'Offer sent and application status updated to selected.',
        application,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
