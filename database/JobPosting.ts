import mongoose, { Schema, Document } from 'mongoose';

export interface IJobPosting extends Document {
  hrId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  domain: string;
  experience: string;
  skillsRequired: string[];
  description: string;
  salary: string;
  deadline: Date;
  status: 'draft' | 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema = new Schema<IJobPosting>(
  {
    hrId: {
      type: Schema.Types.ObjectId,
      ref: 'Hr',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      required: true,
    },
    skillsRequired: {
      type: [String],
      required: true,
      default: [],
    },
    description: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const JobPosting = mongoose.model<IJobPosting>('JobPosting', JobPostingSchema, 'job_postings');
