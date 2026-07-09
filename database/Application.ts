import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  status:
    | 'applied'
    | 'under_review'
    | 'shortlisted'
    | 'rejected'
    | 'interview_scheduled'
    | 'selected'
    | 'interviewed'
    | 'offered'
    | 'hired';
  appliedOn: Date;
  atsScore?: number;
  atsAnalysis?: {
    overallScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    experienceMatch: number;
    educationMatch: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  rejectionReason?: string;
  autoScreenEnabled?: boolean;
  atsCutoffScore?: number;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'applied',
        'under_review',
        'shortlisted',
        'rejected',
        'interview_scheduled',
        'selected',
        'interviewed',
        'offered',
        'hired',
      ],
      default: 'applied',
      index: true,
    },
    appliedOn: {
      type: Date,
      default: Date.now,
      required: true,
    },
    atsScore: {
      type: Number,
    },
    atsAnalysis: {
      overallScore: Number,
      matchedSkills: [String],
      missingSkills: [String],
      experienceMatch: Number,
      educationMatch: Number,
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
    },
    rejectionReason: {
      type: String,
    },
    autoScreenEnabled: {
      type: Boolean,
    },
    atsCutoffScore: {
      type: Number,
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index on (candidateId, jobId)
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>(
  'Application',
  ApplicationSchema,
  'applications'
);
