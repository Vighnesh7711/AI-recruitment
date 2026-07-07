import {
  Interview,
  InterviewReminder,
  Application,
  JobPosting,
  Candidate,
  User,
  Company,
} from '../../../database';
import axios from 'axios';
import logger from '../lib/logger';

export async function autoScheduleInterview(
  applicationId: string,
  hrUserId: string,
  hrUserEmail: string
): Promise<void> {
  try {
    // 1. Fetch application
    const application = await Application.findById(applicationId);
    if (!application) {
      logger.warn(`[Auto-Schedule] Application ${applicationId} not found.`);
      return;
    }

    // 2. Fetch Job
    const job = await JobPosting.findById(application.jobId);
    if (!job) {
      logger.warn(`[Auto-Schedule] Job for application ${applicationId} not found.`);
      return;
    }

    // Check if interview is already scheduled for this application
    const existing = await Interview.findOne({ applicationId: application._id });
    if (existing) {
      logger.info(`[Auto-Schedule] Interview already exists for application ${applicationId}.`);
      return;
    }

    // 3. Create schedule date (24 hours from now, rounded to next 30 min)
    const scheduleDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    scheduleDate.setMinutes(scheduleDate.getMinutes() >= 30 ? 30 : 0);
    scheduleDate.setSeconds(0);
    scheduleDate.setMilliseconds(0);

    // 4. Create Interview
    const interview = await Interview.create({
      applicationId: application._id,
      schedule: scheduleDate,
      durationMinutes: 45,
      meetingLink: `https://meet.jit.si/AI-Recruitment-${application._id}`,
      reminderSent: false,
      result: 'pending',
    });

    // 5. Update Application status to interview_scheduled
    application.status = 'interview_scheduled';
    await application.save();

    // 6. Create Interview Reminder (scheduledTime = schedule - 24 hours)
    const reminderTime = new Date(scheduleDate.getTime() - 24 * 60 * 60 * 1000);
    await InterviewReminder.create({
      interviewId: interview._id,
      scheduledTime: reminderTime,
      emailSent: false,
      whatsappSent: false,
      smsSent: false,
    });

    // 7. Fire N8N_WEBHOOK_INTERVIEW_SCHEDULED
    const webhookUrl = process.env.N8N_WEBHOOK_INTERVIEW_SCHEDULED;
    if (webhookUrl) {
      const candidate = await Candidate.findById(application.candidateId);
      if (candidate) {
        const candidateUser = await User.findById(candidate.userId);
        if (candidateUser) {
          let companyName = 'Our Company';
          if (job.companyId) {
            const company = await Company.findById(job.companyId);
            if (company) companyName = company.companyName;
          }

          await axios.post(
            webhookUrl,
            {
              candidateId: candidate._id.toString(),
              candidateEmail: candidateUser.email,
              candidateName: candidate.name,
              applicationId: application._id.toString(),
              interviewId: interview._id.toString(),
              interviewToken: interview._id.toString(),
              schedule: scheduleDate.toISOString(),
              durationMinutes: 45,
              jobTitle: job.title,
              companyName,
              hrEmail: hrUserEmail,
              isReschedule: false,
            },
            { timeout: 5000 }
          );
          logger.info(
            `[Auto-Schedule] N8N interview-scheduled webhook fired for application ${application._id}`
          );
        }
      }
    }
  } catch (error: any) {
    logger.error(`[Auto-Schedule] Failed to auto-schedule interview: ${error.message}`);
  }
}
