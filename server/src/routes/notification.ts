import { Router, Request, Response, NextFunction } from 'express';
import { Notification } from '../../../database';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();

/**
 * GET /notifications
 * Fetch user's notifications & unread count
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;

      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = await Notification.countDocuments({ userId, isRead: false });

      res.json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notifications/:id/read
 * Mark a single notification as read
 */
router.patch(
  '/:id/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!._id;

      const notification = await Notification.findOne({ _id: id, userId });
      if (!notification) {
        throw new AppError('Notification not found.', 404, 'NOT_FOUND');
      }

      notification.isRead = true;
      await notification.save();

      res.json({ message: 'Notification marked as read.', notification });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read for current user
 */
router.patch(
  '/read-all',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;

      await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });

      res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
