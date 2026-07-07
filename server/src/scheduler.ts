import cron from 'node-cron';
import axios from 'axios';
import { InterviewReminder, Interview, User, JobPosting, Company, Candidate, Hr, Application } from '../../database';
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
        emailSent: false,
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
            reminder.emailSent = true;
            await reminder.save();
            continue;
          }

          if (interview.result === 'rejected') {
            logger.info(
              `[Scheduler] Interview status is rejected for reminder ${reminder._id}. Skipping.`
            );
            reminder.emailSent = true;
            await reminder.save();
            continue;
          }

          if (!interview.schedule) {
            logger.warn(`[Scheduler] Interview ${interview._id} has no schedule time. Skipping.`);
            reminder.emailSent = true;
            await reminder.save();
            continue;
          }

          // Fetch details
          const application = await Application.findById(interview.applicationId);
          if (!application) {
            logger.warn(`[Scheduler] Application not found for interview ${interview._id}. Skipping.`);
            reminder.emailSent = true;
            await reminder.save();
            continue;
          }

          const candidate = await Candidate.findById(application.candidateId);
          const candidateUser = candidate ? await User.findById(candidate.userId) : null;
          const job = await JobPosting.findById(application.jobId);
          const hr = job ? await Hr.findById(job.hrId) : null;
          const hrUser = hr ? await User.findById(hr.userId) : null;

          if (!candidate || !candidateUser || !hr || !hrUser || !job) {
            logger.warn(
              `[Scheduler] Missing candidate, hr, or job details for reminder ${reminder._id}. Skipping.`
            );
            reminder.emailSent = true;
            await reminder.save();
            continue;
          }

          let companyName = 'Our Company';
          if (job.companyId) {
            const company = await Company.findById(job.companyId);
            if (company) {
              companyName = company.companyName;
            }
          }

          const webhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_REMINDER;
          if (webhookUrl) {
            // Trigger webhook
            try {
              await axios.post(
                webhookUrl,
                {
                  reminderId: reminder._id.toString(),
                  interviewId: interview._id.toString(),
                  candidateId: candidate._id.toString(),
                  candidateEmail: candidateUser.email,
                  candidateName: candidate.name,
                  hrEmail: hrUser.email,
                  hrName: hr.name,
                  schedule: interview.schedule.toISOString(),
                  durationMinutes: interview.durationMinutes,
                  jobTitle: job.title,
                  companyName,
                  candidateEmailSent: reminder.emailSent,
                  hrEmailSent: reminder.emailSent,
                },
                { timeout: 5000 }
              );
              logger.info(`[Scheduler] Webhook fired for reminder ${reminder._id}`);
            } catch (webhookErr: any) {
              logger.warn(
                `[Scheduler] Webhook failed to fire for reminder ${reminder._id}: ${webhookErr.message}`
              );
            }
          } else {
            logger.warn('[Scheduler] N8N_WEBHOOK_INTERVIEW_REMINDER is not configured.');
          }

          // Update reminder flags
          reminder.emailSent = true;
          reminder.whatsappSent = true;
          reminder.smsSent = true;
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
