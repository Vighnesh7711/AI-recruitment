import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JobPosting, User, Hr } from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();

/**
 * Helper to optionally parse JWT for public endpoints to determine user role
 */
async function getOptionalUser(req: Request): Promise<any> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.sub) {
      return await User.findById(decoded.sub);
    }
  } catch {
    // Ignore invalid tokens
  }
  return null;
}

/**
 * POST /jobs
 * Body: { title, domain, experience, skillsRequired, description, salary, deadline }
 * Creates a job posting in 'draft' status.
 */
router.post(
  '/',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        title,
        domain,
        experience,
        skillsRequired,
        description,
        salary,
        deadline,
      } = req.body;

      if (!title || !description || !domain || !experience || !skillsRequired || !salary || !deadline) {
        throw new AppError('Missing required fields.', 400, 'VALIDATION_ERROR');
      }

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }

      if (!hr.companyId) {
        throw new AppError('Please complete your company profile before posting jobs.', 400, 'COMPANY_REQUIRED');
      }

      const job = await JobPosting.create({
        hrId: hr._id,
        companyId: hr.companyId,
        title,
        domain,
        experience,
        skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
        description,
        salary: String(salary),
        deadline: new Date(deadline),
        status: 'draft',
      });

      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /jobs (Public List)
 * Query params: ?domain=&status=
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, status } = req.query;
    const user = await getOptionalUser(req);

    const filter: any = {};

    if (domain) {
      filter.domain = { $regex: String(domain), $options: 'i' };
    }

    // HR/Admins can see drafts, candidates only see active
    if (user && user.role === 'hr') {
      if (status) {
        filter.status = String(status);
      }
    } else {
      filter.status = 'active';
    }

    const jobs = await JobPosting.find(filter).populate('companyId').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /jobs/:id (Public Detail)
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getOptionalUser(req);

    const job = await JobPosting.findById(id).populate('companyId');
    if (!job) {
      throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
    }

    const isPrivileged = user && user.role === 'hr';
    if (!isPrivileged && job.status !== 'active') {
      throw new AppError('Job posting is not active.', 403, 'FORBIDDEN');
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /jobs/:id
 * Updates job posting with ownership verification.
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        title,
        domain,
        experience,
        skillsRequired,
        description,
        salary,
        deadline,
        status,
      } = req.body;

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }

      const job = await JobPosting.findById(id);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }

      // Ownership verification
      if (job.hrId.toString() !== hr._id.toString()) {
        throw new AppError(
          'You do not have permission to modify this job posting.',
          403,
          'FORBIDDEN'
        );
      }

      // Update fields
      if (title !== undefined) job.title = title;
      if (description !== undefined) job.description = description;
      if (domain !== undefined) job.domain = domain;
      if (experience !== undefined) job.experience = experience;
      if (skillsRequired !== undefined)
        job.skillsRequired = Array.isArray(skillsRequired) ? skillsRequired : [];
      if (salary !== undefined) job.salary = String(salary);
      if (deadline !== undefined) job.deadline = new Date(deadline);
      if (status !== undefined) {
        if (!['draft', 'active', 'closed'].includes(status)) {
          throw new AppError('Invalid job status.', 400, 'VALIDATION_ERROR');
        }
        job.status = status as 'draft' | 'active' | 'closed';
      }

      await job.save();
      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /jobs/:id/status
 * Body: { status }
 */
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required.', 400, 'VALIDATION_ERROR');
      }

      if (!['draft', 'active', 'closed'].includes(status)) {
        throw new AppError('Invalid status value.', 400, 'VALIDATION_ERROR');
      }

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }

      const job = await JobPosting.findById(id);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }

      // Ownership verification
      if (job.hrId.toString() !== hr._id.toString()) {
        throw new AppError(
          'You do not have permission to modify this job posting.',
          403,
          'FORBIDDEN'
        );
      }

      job.status = status as 'draft' | 'active' | 'closed';
      await job.save();

      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /jobs/:id
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }

      const job = await JobPosting.findById(id);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }

      // Ownership verification
      if (job.hrId.toString() !== hr._id.toString()) {
        throw new AppError(
          'You do not have permission to delete this job posting.',
          403,
          'FORBIDDEN'
        );
      }

      await JobPosting.deleteOne({ _id: id });
      res.json({ message: 'Job posting deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
