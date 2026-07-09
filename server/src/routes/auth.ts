import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { User, Hr, Candidate } from '../../../database';
import { AppError } from '../utils/errors';
import logger from '../lib/logger';

const router = Router();
const BCRYPT_SALT_ROUNDS = 10;

// ── Rate Limiter for Registration and Login ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'Too many attempts. Please try again after 15 minutes.',
        429,
        'TOO_MANY_REQUESTS'
      )
    );
  },
});

/**
 * POST /auth/register/hr
 * Body: { email, password, name, designation, companyId? }
 */
router.post(
  '/register/hr',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name, designation, companyId } = req.body;

      if (!email || !password || !name || !designation) {
        throw new AppError(
          'Missing required fields: email, password, name, designation.',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email is already registered.', 400, 'USER_EXISTS');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      // Verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create User
      const user = await User.create({
        email,
        passwordHash,
        role: 'hr',
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
      });

      // Create Hr profile
      await Hr.create({
        userId: user._id,
        companyId: companyId || undefined,
        name,
        designation,
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const verifyLink = `${clientUrl}/verify-email?token=${verificationToken}`;

      // Fire N8N Registration Webhook (welcome email)
      const registrationWebhookUrl = process.env.N8N_WEBHOOK_REGISTRATION;
      if (registrationWebhookUrl) {
        try {
          await axios.post(
            registrationWebhookUrl,
            {
              email,
              name,
              role: 'hr',
              verificationToken,
              verificationLink: verifyLink,
            },
            { timeout: 5000 }
          );
          logger.info(`[Auth] N8N registration webhook fired for ${email}`);
        } catch (webhookErr: any) {
          logger.warn(`[Auth] N8N registration webhook failed: ${webhookErr.message}`);
        }
      }

      logger.info(`\n==================================================\nVERIFICATION LINK FOR ${email}:\n${verifyLink}\n==================================================\n`);

      res.status(201).json({
        userId: user._id,
        message: 'HR registered successfully. Please check your email to verify your account.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/register/candidate
 * Body: { email, password, name, phone }
 */
router.post(
  '/register/candidate',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name, phone } = req.body;

      if (!email || !password || !name || !phone) {
        throw new AppError(
          'Missing required fields: email, password, name, phone.',
          400,
          'VALIDATION_ERROR'
        );
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email is already registered.', 400, 'USER_EXISTS');
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = await User.create({
        email,
        passwordHash,
        role: 'candidate',
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
      });

      // Create Candidate profile
      await Candidate.create({
        userId: user._id,
        name,
        phone,
        skills: [],
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const verifyLink = `${clientUrl}/verify-email?token=${verificationToken}`;

      // Fire N8N Registration Webhook (welcome email)
      const registrationWebhookUrl = process.env.N8N_WEBHOOK_REGISTRATION;
      if (registrationWebhookUrl) {
        try {
          await axios.post(
            registrationWebhookUrl,
            {
              email,
              name,
              role: 'candidate',
              verificationToken,
              verificationLink: verifyLink,
            },
            { timeout: 5000 }
          );
          logger.info(`[Auth] N8N registration webhook fired for ${email}`);
        } catch (webhookErr: any) {
          logger.warn(`[Auth] N8N registration webhook failed: ${webhookErr.message}`);
        }
      }

      logger.info(`\n==================================================\nVERIFICATION LINK FOR ${email}:\n${verifyLink}\n==================================================\n`);

      res.status(201).json({
        userId: user._id,
        message:
          'Candidate registered successfully. Please check your email to verify your account.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/verify-email
 * Body: { token }
 */
router.post(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('Verification token is required.', 400, 'VALIDATION_ERROR');
      }

      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() },
      });

      if (!user) {
        throw new AppError('Invalid or expired verification token.', 400, 'INVALID_TOKEN');
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiry = undefined;
      await user.save();

      res.json({
        message: 'Email verified successfully. You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Body: { email, password }
 */
router.post(
  '/login',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required.', 400, 'VALIDATION_ERROR');
      }

      const user = await User.findOne({ email });
      if (!user) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.isVerified) {
        throw new AppError(
          'Please verify your email address before logging in.',
          401,
          'EMAIL_NOT_VERIFIED'
        );
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }

      // Generate JWT Access Token
      const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
      const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

      const payload = {
        sub: user._id,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      res.json({
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/forgot-password
 * Body: { email }
 */
router.post(
  '/forgot-password',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required.', 400, 'VALIDATION_ERROR');
      }

      const user = await User.findOne({ email });
      // Security practice: Don't reveal if user exists, but here we can just log
      if (!user) {
        res.json({
          message: 'If that email exists, a password reset link has been sent.',
        });
        return;
      }

      const resetPasswordToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordTokenExpiry = resetPasswordTokenExpiry;
      await user.save();

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetLink = `${clientUrl}/reset-password?token=${resetPasswordToken}`;
      logger.info(`[EMAIL SIMULATOR] Password Reset Email for ${email}`);
      logger.info(`Reset Link: ${resetLink}`);

      res.json({
        message: 'If that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/reset-password
 * Body: { token, newPassword }
 */
router.post(
  '/reset-password',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new AppError('Token and new password are required.', 400, 'VALIDATION_ERROR');
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { $gt: new Date() },
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token.', 400, 'INVALID_TOKEN');
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

      user.passwordHash = passwordHash;
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpiry = undefined;
      await user.save();

      res.json({
        message: 'Password reset successful. You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
