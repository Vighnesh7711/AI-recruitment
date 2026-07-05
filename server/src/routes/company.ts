import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Company, Hr } from '../../../database';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import { AppError } from '../utils/errors';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * POST /company
 * Body: { companyName, website, industry }
 * File: logo (optional)
 * Creates a company, uploads logo if present, and links company to the requesting HR.
 */
router.post(
  '/',
  requireAuth,
  requireRole('hr'),
  upload.single('logo'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyName, website, industry } = req.body;

      if (!companyName) {
        throw new AppError('companyName is required.', 400, 'VALIDATION_ERROR');
      }

      // Check if company already exists
      const existingCompany = await Company.findOne({ companyName });
      if (existingCompany) {
        throw new AppError('A company with this name already exists.', 400, 'COMPANY_EXISTS');
      }

      let logo: string | undefined = undefined;
      if (req.file) {
        logo = await uploadToCloudinary(req.file.buffer, 'company_logos');
      }

      // Create company
      const company = await Company.create({
        companyName,
        website,
        industry,
        logo,
      });

      // Set companyId for the requesting HR
      const hr = await Hr.findOne({ userId: req.user!._id });
      if (hr) {
        hr.companyId = company._id;
        await hr.save();
      }

      res.status(201).json(company);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /company/:id
 * Body: { companyName, website, industry }
 * File: logo (optional)
 * Updates the company if the requesting HR is linked to this company.
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('hr'),
  upload.single('logo'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { companyName, website, industry } = req.body;

      // Ownership check: requesting HR's companyId must match the company's ID
      const hr = await Hr.findOne({ userId: req.user!._id });
      if (!hr || !hr.companyId || hr.companyId.toString() !== id) {
        throw new AppError('You do not have permission to update this company.', 403, 'FORBIDDEN');
      }

      const company = await Company.findById(id);
      if (!company) {
        throw new AppError('Company not found.', 404, 'NOT_FOUND');
      }

      // Handle logo upload if provided
      let logo = company.logo;
      if (req.file) {
        logo = await uploadToCloudinary(req.file.buffer, 'company_logos');
      }

      // Update fields
      if (companyName) {
        // Check if name is taken by another company
        const duplicate = await Company.findOne({ companyName, _id: { $ne: id } });
        if (duplicate) {
          throw new AppError('A company with this name already exists.', 400, 'COMPANY_EXISTS');
        }
        company.companyName = companyName;
      }

      if (website !== undefined) company.website = website;
      if (industry !== undefined) company.industry = industry;
      company.logo = logo;

      await company.save();

      res.json(company);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /company/:id
 * Public read endpoint for company details.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      throw new AppError('Company not found.', 404, 'NOT_FOUND');
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
});

export default router;
