import cron from 'node-cron';
import axios from 'axios';
import { InterviewReminder, Interview, User, JobPosting, Company } from '../../database';
import logger from './lib/logger';

export function startScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    logger.debug('[Scheduler] Running interview reminder cron job...');
    try {
      const now = new Date();
      // Find reminders that are due and not yet sent
      const pendingReminders = await InterviewReminder.find({
        scheduledTime: { $lte: now },
        $or: [{ candidateEmailSent: false }, { hrEmailSent: false }],
      });

      if (pendingReminders.length === 0) {
        return;
      }

      logger.info(
        `[Scheduler] Found ${pendingReminders.length} pending interview reminder(s) to process.`
      );

      for (const reminder of pendingReminders) {
        try {
          const interview = await Interview.findById(reminder.interviewId);
          if (!interview) {
            logger.warn(`[Scheduler] Interview not found for reminder ${reminder._id}. Skipping.`);
            // Mark as sent to prevent infinite retries
            reminder.candidateEmailSent = true;
            reminder.hrEmailSent = true;
            await reminder.save();
            continue;
          }

          if (interview.status === 'cancelled' || interview.status === 'expired') {
            logger.info(
              `[Scheduler] Interview status is ${interview.status} for reminder ${reminder._id}. Skipping.`
            );
            reminder.candidateEmailSent = true;
            reminder.hrEmailSent = true;
            await reminder.save();
            continue;
          }

          if (!interview.scheduledAt) {
            logger.warn(`[Scheduler] Interview ${interview._id} has no scheduled time. Skipping.`);
            reminder.candidateEmailSent = true;
            reminder.hrEmailSent = true;
            await reminder.save();
            continue;
          }

          // Fetch details
          const candidate = await User.findById(interview.candidateId);
          const hr = await User.findById(interview.invitedBy);
          const job = await JobPosting.findById(interview.jobId);

          if (!candidate || !hr || !job) {
            logger.warn(
              `[Scheduler] Missing candidate, hr, or job details for reminder ${reminder._id}. Skipping.`
            );
            reminder.candidateEmailSent = true;
            reminder.hrEmailSent = true;
            await reminder.save();
            continue;
          }

          let companyName = 'Our Company';
          if (job.companyId) {
            const company = await Company.findById(job.companyId);
            if (company) {
              companyName = company.name;
            }
          }

          const webhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_REMINDER;
          if (webhookUrl) {
            // Trigger webhook
            await axios.post(
              webhookUrl,
              {
                reminderId: reminder._id.toString(),
                interviewId: interview._id.toString(),
                candidateId: candidate._id.toString(),
                candidateEmail: candidate.email,
                candidateName: candidate.fullName,
                hrEmail: hr.email,
                hrName: hr.fullName,
                schedule: interview.scheduledAt.toISOString(),
                durationMinutes: interview.duration,
                jobTitle: job.title,
                companyName,
                candidateEmailSent: reminder.candidateEmailSent,
                hrEmailSent: reminder.hrEmailSent,
              },
              { timeout: 5000 }
            );

            logger.info(`[Scheduler] Webhook fired for reminder ${reminder._id}`);
          } else {
            logger.warn('[Scheduler] N8N_WEBHOOK_INTERVIEW_REMINDER is not configured.');
          }

          // Update reminder flags
          reminder.candidateEmailSent = true;
          reminder.hrEmailSent = true;
          await reminder.save();
        } catch (reminderErr: any) {
          logger.error(
            `[Scheduler] Error processing reminder ${reminder._id}: ${reminderErr.message}`
          );
        }
      }
    } catch (err: any) {
      logger.error(`[Scheduler] Error in reminder scheduler cron: ${err.message}`);
    }
  });

  logger.info('[Scheduler] Interview reminder cron job initialized successfully.');
}
