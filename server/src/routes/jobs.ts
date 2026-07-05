import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JobPosting, User } from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();

/**
 * Helper to optionally parse JWT for public endpoints to determine user role
 * (since guests/candidates have restricted views but HR can see drafts on public endpoints).
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
    // Ignore invalid tokens for optional auth
  }
  return null;
}

/**
 * POST /jobs
 * Body: { title, domain, experience, skillsRequired, description, salary, deadline, location, locationType, employmentType }
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
        location,
        locationType,
        employmentType,
      } = req.body;

      if (!title || !description) {
        throw new AppError('Missing required fields: title, description.', 400, 'VALIDATION_ERROR');
      }

      // Map incoming request body to the JobPosting schema fields
      const job = await JobPosting.create({
        title,
        description,
        department: domain || 'General',
        experienceLevel: experience || 'mid',
        skills: Array.isArray(skillsRequired) ? skillsRequired : [],
        requirements: req.body.requirements || [],
        salaryMin: salary ? Number(salary) : undefined,
        salaryMax: salary ? Number(salary) : undefined,
        applicationDeadline: deadline ? new Date(deadline) : undefined,
        location: location || 'Remote',
        locationType: locationType || 'remote',
        employmentType: employmentType || 'full-time',
        postedBy: req.user!._id,
        companyId: req.user!.companyId,
        status: 'draft', // Forced to draft on create
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
 * Candidates always see only status:'active' regardless of query.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, status } = req.query;
    const user = await getOptionalUser(req);

    const filter: any = {};

    // Filter by domain (department in DB)
    if (domain) {
      filter.department = { $regex: String(domain), $options: 'i' };
    }

    // Role check: candidates/guests always see active postings only
    if (user && (user.role === 'hr' || user.role === 'admin')) {
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

    // Restrict access to drafts/paused for candidates/guests
    const isPrivileged = user && (user.role === 'hr' || user.role === 'admin');
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
        location,
        locationType,
        employmentType,
        status,
      } = req.body;

      const job = await JobPosting.findById(id);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }

      // Ownership verification
      if (job.postedBy.toString() !== req.user!._id.toString()) {
        throw new AppError(
          'You do not have permission to modify this job posting.',
          403,
          'FORBIDDEN'
        );
      }

      // Update fields
      if (title !== undefined) job.title = title;
      if (description !== undefined) job.description = description;
      if (domain !== undefined) job.department = domain;
      if (experience !== undefined) job.experienceLevel = experience;
      if (skillsRequired !== undefined)
        job.skills = Array.isArray(skillsRequired) ? skillsRequired : [];
      if (salary !== undefined) {
        job.salaryMin = Number(salary);
        job.salaryMax = Number(salary);
      }
      if (deadline !== undefined)
        job.applicationDeadline = deadline ? new Date(deadline) : undefined;
      if (location !== undefined) job.location = location;
      if (locationType !== undefined) job.locationType = locationType;
      if (employmentType !== undefined) job.employmentType = employmentType;
      if (status !== undefined) {
        if (!['draft', 'active', 'paused', 'closed'].includes(status)) {
          throw new AppError('Invalid job status.', 400, 'VALIDATION_ERROR');
        }
        job.status = status;
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
 * Updates the status of a job posting (e.g. toggle active/paused).
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

      if (!['draft', 'active', 'paused', 'closed'].includes(status)) {
        throw new AppError('Invalid status value.', 400, 'VALIDATION_ERROR');
      }

      const job = await JobPosting.findById(id);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }

      // Ownership verification
      if (job.postedBy.toString() !== req.user!._id.toString()) {
        throw new AppError(
          'You do not have permission to modify this job posting.',
          403,
          'FORBIDDEN'
        );
      }

      job.status = status as 'draft' | 'active' | 'paused' | 'closed';
      await job.save();

      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /jobs/:id
 * Deletes the job posting.
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const job = await JobPosting.findById(id);
      if (!job) {
        throw new AppError('Job posting not found.', 404, 'NOT_FOUND');
      }

      // Ownership verification
      if (job.postedBy.toString() !== req.user!._id.toString()) {
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
