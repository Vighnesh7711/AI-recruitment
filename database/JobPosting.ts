import mongoose, { Schema, Document } from 'mongoose';

export interface IJobPosting extends Document {
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  department?: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  companyId?: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  status: 'draft' | 'active' | 'paused' | 'closed';
  applicationDeadline?: Date;
  applicationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema = new Schema<IJobPosting>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [{ type: String }],
    skills: [{ type: String }],
    department: String,
    location: {
      type: String,
      required: true,
    },
    locationType: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite',
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      default: 'full-time',
    },
    salaryMin: Number,
    salaryMax: Number,
    salaryCurrency: {
      type: String,
      default: 'USD',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
      default: 'mid',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed'],
      default: 'active',
      index: true,
    },
    applicationDeadline: Date,
    applicationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const JobPosting = mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
