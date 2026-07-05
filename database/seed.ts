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

// Import all models to ensure schemas are registered
import { User } from './User';
import { Company } from './Company';
import { JobPosting } from './JobPosting';
import { Application } from './Application';
import { Interview } from './Interview';
import { InterviewEvaluation } from './InterviewEvaluation';
import { Notification } from './Notification';
import { ActivityLog } from './ActivityLog';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

async function seed() {
  console.log('--- Seed Script Starting ---');

  await connectDB();

  console.log('\n[1/8] Creating User...');
  const user = await User.create({
    email: 'seed-admin@test.com',
    passwordHash: '$2b$10$dummyHashForSeedingOnly1234567890abcdefgh',
    fullName: 'Seed Admin',
    role: 'admin',
    phone: '+1-555-0100',
    isActive: true,
  });
  console.log(`  -> User created: ${user._id} (${user.email})`);

  console.log('\n[2/8] Creating Company...');
  const company = await Company.create({
    name: 'Seed Corp',
    description: 'A seed test company',
    website: 'https://seedcorp.example.com',
    industry: 'Technology',
    size: '51-200',
    location: 'San Francisco, CA',
    createdBy: user._id,
  });
  console.log(`  -> Company created: ${company._id} (${company.name})`);

  // Update user with companyId
  await User.findByIdAndUpdate(user._id, { companyId: company._id });

  console.log('\n[3/8] Creating JobPosting...');
  const job = await JobPosting.create({
    title: 'Senior TypeScript Developer',
    description: 'We are looking for a senior TypeScript developer to join our team.',
    requirements: [
      '5+ years of TypeScript experience',
      'React or Angular experience',
      'Node.js backend experience',
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'MongoDB', 'REST APIs'],
    department: 'Engineering',
    location: 'Remote',
    locationType: 'remote',
    employmentType: 'full-time',
    salaryMin: 120000,
    salaryMax: 180000,
    salaryCurrency: 'USD',
    experienceLevel: 'senior',
    companyId: company._id,
    postedBy: user._id,
    status: 'active',
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    applicationCount: 0,
  });
  console.log(`  -> JobPosting created: ${job._id} (${job.title})`);

  // Create a candidate user for the application
  const candidate = await User.create({
    email: 'seed-candidate@test.com',
    passwordHash: '$2b$10$dummyHashForSeedingOnly1234567890abcdefgh',
    fullName: 'Jane Candidate',
    role: 'candidate',
    phone: '+1-555-0200',
    isActive: true,
  });
  console.log(`  -> Candidate user created: ${candidate._id}`);

  console.log('\n[4/8] Creating Application...');
  const application = await Application.create({
    jobId: job._id,
    candidateId: candidate._id,
    resumePath: '/uploads/seed-resume.pdf',
    resumeOriginalName: 'jane_candidate_resume.pdf',
    coverLetter: 'I am excited to apply for this position...',
    parsedResume: {
      name: 'Jane Candidate',
      experience: '6 years',
      skills: ['TypeScript', 'React', 'Node.js'],
    },
    atsScore: 78,
    atsAnalysis: {
      overallScore: 78,
      matchedSkills: ['TypeScript', 'React', 'Node.js'],
      missingSkills: ['MongoDB'],
      experienceMatch: 85,
      educationMatch: 70,
      strengths: ['Strong frontend skills', 'Good communication'],
      weaknesses: ['Limited database experience'],
      recommendations: ['Gain MongoDB experience'],
    },
    status: 'shortlisted',
    finalScore: 82.4,
    reviewedBy: user._id,
    reviewedAt: new Date(),
  });
  console.log(`  -> Application created: ${application._id}`);

  console.log('\n[5/8] Creating Interview...');
  const interview = await Interview.create({
    applicationId: application._id,
    candidateId: candidate._id,
    jobId: job._id,
    token: `seed-token-${Date.now()}`,
    status: 'completed',
    scheduledAt: new Date(),
    startedAt: new Date(),
    completedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    questions: [
      {
        questionId: 'q1',
        text: 'Explain the difference between interface and type in TypeScript.',
        category: 'technical',
        weight: 2,
        candidateAnswer:
          'An interface is extensible through declaration merging while type aliases use intersections...',
        aiScore: 85,
        aiFeedback: 'Solid understanding of TypeScript type system.',
      },
      {
        questionId: 'q2',
        text: 'Describe a challenging project you led.',
        category: 'behavioral',
        weight: 1,
        candidateAnswer:
          'I led a migration from JavaScript to TypeScript for a 200k LOC codebase...',
        aiScore: 90,
        aiFeedback: 'Excellent leadership and technical decision-making.',
      },
    ],
    interviewType: 'ai_avatar',
    duration: 45,
    invitedBy: user._id,
  });
  console.log(`  -> Interview created: ${interview._id}`);

  console.log('\n[6/8] Creating InterviewEvaluation...');
  const evaluation = await InterviewEvaluation.create({
    interviewId: interview._id,
    applicationId: application._id,
    candidateId: candidate._id,
    technicalScore: 85,
    communicationScore: 88,
    problemSolvingScore: 82,
    cultureFitScore: 90,
    confidenceScore: 87,
    overallInterviewScore: 86,
    atsScore: 78,
    finalWeightedScore: 0.3 * 78 + 0.7 * 86, // 83.6
    strengths: ['Strong TypeScript knowledge', 'Great communication'],
    weaknesses: ['Limited MongoDB experience'],
    summary: 'Strong candidate with excellent frontend skills and leadership experience.',
    recommendation: 'hire',
    hrDecision: 'pending',
  });
  console.log(`  -> InterviewEvaluation created: ${evaluation._id}`);

  console.log('\n[7/8] Creating Notification...');
  const notification = await Notification.create({
    userId: candidate._id,
    title: 'Application Shortlisted',
    message: 'Your application for Senior TypeScript Developer has been shortlisted!',
    type: 'application_update',
    link: '/applications',
    isRead: false,
  });
  console.log(`  -> Notification created: ${notification._id}`);

  console.log('\n[8/8] Creating ActivityLog...');
  const activityLog = await ActivityLog.create({
    userId: user._id,
    action: 'SEED_DATABASE',
    resource: 'system',
    resourceId: 'seed-script',
    details: { seededAt: new Date().toISOString(), collections: 8 },
    ipAddress: '127.0.0.1',
    userAgent: 'seed-script/1.0',
  });
  console.log(`  -> ActivityLog created: ${activityLog._id}`);

  // ── Verify indexes ──
  console.log('\n--- Verifying Indexes ---');
  const collections = [
    { name: 'users', model: User },
    { name: 'companies', model: Company },
    { name: 'jobpostings', model: JobPosting },
    { name: 'applications', model: Application },
    { name: 'interviews', model: Interview },
    { name: 'interview_evaluations', model: InterviewEvaluation },
    { name: 'notifications', model: Notification },
    { name: 'activitylogs', model: ActivityLog },
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
  await InterviewEvaluation.deleteOne({ _id: evaluation._id });
  await Interview.deleteOne({ _id: interview._id });
  await Application.deleteOne({ _id: application._id });
  await JobPosting.deleteOne({ _id: job._id });
  await Company.deleteOne({ _id: company._id });
  await User.deleteMany({
    email: { $in: ['seed-admin@test.com', 'seed-candidate@test.com'] },
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
