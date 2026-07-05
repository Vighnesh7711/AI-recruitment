import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../../database';
import { AppError } from '../utils/errors';

// Extend Express Request interface to include the user property
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Middleware to require JWT authentication.
 * Verifies Authorization: Bearer <token> header, fetches the user, and attaches it to req.user.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is missing or invalid.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Access token has expired.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid access token.', 401, 'UNAUTHORIZED');
    }

    if (!decoded.sub) {
      throw new AppError('Invalid token payload.', 401, 'UNAUTHORIZED');
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new AppError('User not found.', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to restrict access based on roles.
 * Must be used AFTER requireAuth.
 */
export function requireRole(...allowedRoles: ('hr' | 'candidate')[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
