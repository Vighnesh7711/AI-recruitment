import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  User,
  Hr,
  Candidate,
  Company,
  Application,
  JobPosting,
  Resume,
  Interview,
} from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadImage } from '../utils/cloudinary';
import { AppError } from '../utils/errors';

const router = Router();

// Profile pictures are images only, capped at 5MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(
        new AppError('Only image files are allowed for profile pictures.', 400, 'INVALID_FILE_TYPE')
      );
    }
    cb(null, true);
  },
});

/**
 * GET /profile/me
 * Returns the logged-in user's merged profile (email from User + role profile).
 */
router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      if (user.role === 'hr') {
        const hr = await Hr.findOne({ userId: user._id });
        if (!hr) {
          throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
        }
        let company: any = null;
        if (hr.companyId) {
          company = await Company.findById(hr.companyId);
        }
        res.json({
          role: 'hr',
          id: hr._id,
          email: user.email,
          name: hr.name,
          designation: hr.designation || '',
          profilePicture: hr.profilePicture || '',
          company: company
            ? { _id: company._id, companyName: company.companyName, logo: company.logo }
            : null,
        });
        return;
      }

      const candidate = await Candidate.findOne({ userId: user._id });
      if (!candidate) {
        throw new AppError('Candidate profile not found.', 404, 'NOT_FOUND');
      }
      res.json({
        role: 'candidate',
        id: candidate._id,
        email: user.email,
        name: candidate.name,
        phone: candidate.phone || '',
        education: candidate.education || '',
        experience: candidate.experience || '',
        skills: candidate.skills || [],
        github: candidate.github || '',
        linkedin: candidate.linkedin || '',
        profilePicture: candidate.profilePicture || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /profile/me
 * Multipart form: name + role-specific fields + optional profilePicture (image).
 */
router.put(
  '/me',
  requireAuth,
  upload.single('profilePicture'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const body = req.body || {};

      let profilePicture: string | undefined;
      if (req.file) {
        profilePicture = await uploadImage(req.file.buffer, 'profiles', req.file.mimetype);
      }

      if (user.role === 'hr') {
        const hr = await Hr.findOne({ userId: user._id });
        if (!hr) {
          throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
        }
        if (body.name !== undefined && body.name.trim()) hr.name = body.name.trim();
        if (body.designation !== undefined) hr.designation = body.designation;
        if (profilePicture) hr.profilePicture = profilePicture;
        await hr.save();

        res.json({
          role: 'hr',
          id: hr._id,
          email: user.email,
          name: hr.name,
          designation: hr.designation || '',
          profilePicture: hr.profilePicture || '',
        });
        return;
      }

      const candidate = await Candidate.findOne({ userId: user._id });
      if (!candidate) {
        throw new AppError('Candidate profile not found.', 404, 'NOT_FOUND');
      }
      if (body.name !== undefined && body.name.trim()) candidate.name = body.name.trim();
      if (body.phone !== undefined) candidate.phone = body.phone;
      if (body.education !== undefined) candidate.education = body.education;
      if (body.experience !== undefined) candidate.experience = body.experience;
      if (body.github !== undefined) candidate.github = body.github;
      if (body.linkedin !== undefined) candidate.linkedin = body.linkedin;
      if (body.skills !== undefined) {
        // Accept either an array or a comma-separated string.
        const raw = body.skills;
        const arr = Array.isArray(raw)
          ? raw
          : String(raw)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
        candidate.skills = arr;
      }
      if (profilePicture) candidate.profilePicture = profilePicture;
      await candidate.save();

      res.json({
        role: 'candidate',
        id: candidate._id,
        email: user.email,
        name: candidate.name,
        phone: candidate.phone || '',
        education: candidate.education || '',
        experience: candidate.experience || '',
        skills: candidate.skills || [],
        github: candidate.github || '',
        linkedin: candidate.linkedin || '',
        profilePicture: candidate.profilePicture || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /profile/candidate/:id
 * HR-only: view a candidate's profile. Access is limited to candidates who have
 * applied to a job owned by the requesting HR's company.
 */
router.get(
  '/candidate/:id',
  requireAuth,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr) {
        throw new AppError('HR profile not found.', 404, 'NOT_FOUND');
      }
      if (!hr.companyId) {
        throw new AppError('Please complete your company profile first.', 400, 'COMPANY_REQUIRED');
      }

      const candidate = await Candidate.findById(id);
      if (!candidate) {
        throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
      }

      // Authorization: the candidate must have applied to one of this company's jobs.
      const companyJobs = await JobPosting.find({ companyId: hr.companyId }).select('_id');
      const companyJobIds = companyJobs.map((j) => j._id);
      const linkingApplication = await Application.findOne({
        candidateId: candidate._id,
        jobId: { $in: companyJobIds },
      });
      if (!linkingApplication) {
        throw new AppError('You do not have permission to view this candidate.', 403, 'FORBIDDEN');
      }

      const candidateUser = await User.findById(candidate.userId);
      const latestResume = await Resume.findOne({ candidateId: candidate._id }).sort({
        uploadDate: -1,
      });

      res.json({
        _id: candidate._id,
        name: candidate.name,
        email: candidateUser ? candidateUser.email : '',
        phone: candidate.phone || '',
        education: candidate.education || '',
        experience: candidate.experience || '',
        skills: candidate.skills || [],
        github: candidate.github || '',
        linkedin: candidate.linkedin || '',
        profilePicture: candidate.profilePicture || '',
        resumeId: latestResume ? latestResume._id : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /profile/hr/by-application/:applicationId
 * Candidate-only: view the recruiter/HR profile behind one of their own
 * applications (the HR who owns the applied job).
 */
router.get(
  '/hr/by-application/:applicationId',
  requireAuth,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { applicationId } = req.params;

      const candidate = await Candidate.findOne({ userId: req.user!._id });
      if (!candidate) {
        throw new AppError('Candidate profile not found.', 404, 'NOT_FOUND');
      }

      const application = await Application.findById(applicationId);
      if (!application) {
        throw new AppError('Application not found.', 404, 'NOT_FOUND');
      }
      if (application.candidateId.toString() !== candidate._id.toString()) {
        throw new AppError('You do not have permission to view this recruiter.', 403, 'FORBIDDEN');
      }

      const job = await JobPosting.findById(application.jobId);
      if (!job) {
        throw new AppError('Associated job posting not found.', 404, 'NOT_FOUND');
      }

      const hr = await Hr.findById(job.hrId);
      if (!hr) {
        throw new AppError('Recruiter profile not found.', 404, 'NOT_FOUND');
      }
      const hrUser = await User.findById(hr.userId);
      let company: any = null;
      if (job.companyId) {
        company = await Company.findById(job.companyId);
      }

      res.json({
        _id: hr._id,
        name: hr.name,
        email: hrUser ? hrUser.email : '',
        designation: hr.designation || '',
        profilePicture: hr.profilePicture || '',
        company: company
          ? { _id: company._id, companyName: company.companyName, logo: company.logo }
          : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
