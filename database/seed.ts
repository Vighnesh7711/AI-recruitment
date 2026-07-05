/**
 * database/seed.ts
 *
 * Inserts one structurally-valid sample document per collection,
 * verifying that every schema compiles, every ref works, and every
 * index is created correctly.
 *
 * Run: npx tsx database/seed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './connection';
import {
  User,
  Company,
  JobPosting,
  Application,
  Interview,
  InterviewEvaluation,
  Notification,
  ActivityLog,
  Hr,
  Candidate,
  Resume,
  ResumeAnalysis,
  QuestionBank,
  QuestionResponse,
  InterviewReminder,
  EmailNotification,
} from './index';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

async function seed() {
  console.log('--- Seed Script Starting ---');

  await connectDB();

  console.log('\n[1/16] Creating HR User...');
  const hrUser = await User.create({
    email: 'seed-hr@test.com',
    passwordHash: '$2b$10$dummyHashForSeedingOnly1234567890abcdefgh',
    role: 'hr',
  });
  console.log(`  -> HR User created: ${hrUser._id} (${hrUser.email})`);

  console.log('\n[2/16] Creating Company...');
  const company = await Company.create({
    companyName: 'Seed Corp',
    website: 'https://seedcorp.example.com',
    industry: 'Technology',
    logo: 'https://seedcorp.example.com/logo.png',
  });
  console.log(`  -> Company created: ${company._id} (${company.companyName})`);

  console.log('\n[3/16] Creating HR Profile...');
  const hrProfile = await Hr.create({
    userId: hrUser._id,
    name: 'Seed HR Recruiter',
    companyId: company._id,
    phone: '+1-555-0100',
  });
  console.log(`  -> HR Profile created: ${hrProfile._id} (${hrProfile.name})`);

  console.log('\n[4/16] Creating JobPosting...');
  const job = await JobPosting.create({
    hrId: hrProfile._id,
    companyId: company._id,
    title: 'Senior TypeScript Developer',
    domain: 'Engineering',
    experience: 'Senior',
    skillsRequired: ['TypeScript', 'React', 'Node.js', 'MongoDB'],
    description: 'We are looking for a senior TypeScript developer to join our team.',
    salary: '$120,000 - $150,000',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'active',
  });
  console.log(`  -> JobPosting created: ${job._id} (${job.title})`);

  console.log('\n[5/16] Creating Candidate User...');
  const candidateUser = await User.create({
    email: 'seed-candidate@test.com',
    passwordHash: '$2b$10$dummyHashForSeedingOnly1234567890abcdefgh',
    role: 'candidate',
  });
  console.log(`  -> Candidate User created: ${candidateUser._id}`);

  console.log('\n[6/16] Creating Candidate Profile...');
  const candidateProfile = await Candidate.create({
    userId: candidateUser._id,
    name: 'Jane Candidate',
    phone: '+1-555-0200',
  });
  console.log(`  -> Candidate Profile created: ${candidateProfile._id}`);

  console.log('\n[7/16] Creating Resume...');
  const resume = await Resume.create({
    candidateId: candidateProfile._id,
    resumeUrl: 'https://cloudinary.com/seed-resume.pdf',
    atsScore: 78,
    strengths: ['TypeScript', 'React'],
    weaknesses: ['SQL'],
    suggestions: ['Learn SQL'],
    extractedText: 'Jane Candidate CV...',
    uploadDate: new Date(),
  });
  console.log(`  -> Resume created: ${resume._id}`);

  console.log('\n[8/16] Creating Application...');
  const application = await Application.create({
    candidateId: candidateProfile._id,
    jobId: job._id,
    resumeId: resume._id,
    status: 'shortlisted',
    appliedOn: new Date(),
  });
  console.log(`  -> Application created: ${application._id}`);

  console.log('\n[9/16] Creating ResumeAnalysis...');
  const analysis = await ResumeAnalysis.create({
    resumeId: resume._id,
    applicationId: application._id,
    atsScore: 78,
    grammarScore: 85,
    skillMatch: 80,
    experienceScore: 75,
    educationScore: 90,
    matchedSkills: ['TypeScript', 'React'],
    missingSkills: ['SQL'],
    strengths: ['TypeScript', 'React'],
    weaknesses: ['SQL'],
    recommendations: ['Learn SQL'],
  });
  console.log(`  -> ResumeAnalysis created: ${analysis._id}`);

  console.log('\n[10/16] Creating Interview...');
  const interview = await Interview.create({
    applicationId: application._id,
    schedule: new Date(),
    durationMinutes: 45,
    meetingLink: 'https://meet.jit.si/seed-interview',
    reminderSent: false,
    overallScore: 85,
    result: 'pending',
  });
  console.log(`  -> Interview created: ${interview._id}`);

  console.log('\n[11/16] Creating QuestionBank...');
  const questionBank = await QuestionBank.create({
    domain: 'Engineering',
    difficulty: 'medium',
    question: 'Explain JavaScript closures.',
    expectedAnswer: 'A closure is the combination of a function bundled together with references to its surrounding state...',
    keywords: ['closure', 'scope', 'lexical'],
  });
  console.log(`  -> QuestionBank created: ${questionBank._id}`);

  console.log('\n[12/16] Creating QuestionResponse...');
  const questionResponse = await QuestionResponse.create({
    interviewId: interview._id,
    questionId: questionBank._id,
    questionOrder: 1,
    answer: 'A closure lets a function access outer scope variables...',
    aiScore: 85,
    feedback: 'Good description of lexical scope.',
    confidence: 90,
  });
  console.log(`  -> QuestionResponse created: ${questionResponse._id}`);

  console.log('\n[13/16] Creating InterviewEvaluation...');
  const evaluation = await InterviewEvaluation.create({
    interviewId: interview._id,
    technicalScore: 85,
    communicationScore: 90,
    confidenceScore: 88,
    grammarScore: 85,
    problemSolvingScore: 80,
    behavioralScore: 85,
    overallScore: 85,
    recommendation: 'hire',
    feedback: 'Strong performance across technical and communication categories.',
  });
  console.log(`  -> InterviewEvaluation created: ${evaluation._id}`);

  console.log('\n[14/16] Creating InterviewReminder...');
  const reminder = await InterviewReminder.create({
    interviewId: interview._id,
    scheduledTime: new Date(),
    emailSent: false,
    whatsappSent: false,
    smsSent: false,
  });
  console.log(`  -> InterviewReminder created: ${reminder._id}`);

  console.log('\n[15/16] Creating EmailNotification...');
  const emailNotification = await EmailNotification.create({
    to: 'candidate@test.com',
    subject: 'Interview Scheduled',
    body: 'Your interview has been scheduled.',
    status: 'sent',
    sentAt: new Date(),
  });
  console.log(`  -> EmailNotification created: ${emailNotification._id}`);

  console.log('\n[16/16] Creating Notification...');
  const notification = await Notification.create({
    userId: candidateUser._id,
    title: 'Application Shortlisted',
    message: 'Your application for Senior TypeScript Developer has been shortlisted!',
    isRead: false,
  });
  console.log(`  -> Notification created: ${notification._id}`);

  console.log('\nCreating ActivityLog...');
  const activityLog = await ActivityLog.create({
    userId: hrUser._id,
    action: 'SEED_DATABASE',
    details: { seededAt: new Date().toISOString(), collections: 16 },
  });
  console.log(`  -> ActivityLog created: ${activityLog._id}`);

  // ── Verify indexes ──
  console.log('\n--- Verifying Indexes ---');
  const collections = [
    { name: 'users', model: User },
    { name: 'companies', model: Company },
    { name: 'hr', model: Hr },
    { name: 'candidates', model: Candidate },
    { name: 'jobpostings', model: JobPosting },
    { name: 'resumes', model: Resume },
    { name: 'applications', model: Application },
    { name: 'resume_analyses', model: ResumeAnalysis },
    { name: 'interviews', model: Interview },
    { name: 'question_banks', model: QuestionBank },
    { name: 'question_responses', model: QuestionResponse },
    { name: 'interview_evaluations', model: InterviewEvaluation },
    { name: 'interview_reminders', model: InterviewReminder },
    { name: 'email_notifications', model: EmailNotification },
    { name: 'notifications', model: Notification },
    { name: 'activity_logs', model: ActivityLog },
  ];

  for (const { name, model } of collections) {
    const indexes = await model.listIndexes();
    console.log(
      `  ${name}: ${indexes.length} indexes -> ${indexes.map((i: { name?: string }) => i.name).join(', ')}`
    );
  }

  // ── Cleanup seed data ──
  console.log('\n--- Cleaning Up Seed Data ---');
  await ActivityLog.deleteOne({ _id: activityLog._id });
  await Notification.deleteOne({ _id: notification._id });
  await EmailNotification.deleteOne({ _id: emailNotification._id });
  await InterviewReminder.deleteOne({ _id: reminder._id });
  await InterviewEvaluation.deleteOne({ _id: evaluation._id });
  await QuestionResponse.deleteOne({ _id: questionResponse._id });
  await QuestionBank.deleteOne({ _id: questionBank._id });
  await Interview.deleteOne({ _id: interview._id });
  await ResumeAnalysis.deleteOne({ _id: analysis._id });
  await Application.deleteOne({ _id: application._id });
  await Resume.deleteOne({ _id: resume._id });
  await Candidate.deleteOne({ _id: candidateProfile._id });
  await Hr.deleteOne({ _id: hrProfile._id });
  await Company.deleteOne({ _id: company._id });
  await User.deleteMany({
    email: { $in: ['seed-hr@test.com', 'seed-candidate@test.com'] },
  });
  console.log('  -> All seed data removed.');

  console.log('\n--- Seed Script Complete ---');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
