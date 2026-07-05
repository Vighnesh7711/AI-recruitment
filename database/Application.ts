import mongoose, { Schema, Document } from 'mongoose';

export interface IATSAnalysis {
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: number;
  educationMatch: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  resumePath?: string;
  resumeOriginalName?: string;
  coverLetter?: string;
  parsedResume?: Record<string, unknown>;
  atsScore?: number;
  atsAnalysis?: IATSAnalysis;
  status:
    | 'applied'
    | 'submitted'
    | 'under_review'
    | 'shortlisted'
    | 'interview_scheduled'
    | 'interviewed'
    | 'offered'
    | 'hired'
    | 'rejected'
    | 'withdrawn';
  rejectionReason?: string;
  finalScore?: number;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ATSAnalysisSchema = new Schema<IATSAnalysis>(
  {
    overallScore: Number,
    matchedSkills: [String],
    missingSkills: [String],
    experienceMatch: Number,
    educationMatch: Number,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumePath: String,
    resumeOriginalName: String,
    coverLetter: String,
    parsedResume: Schema.Types.Mixed,
    atsScore: Number,
    atsAnalysis: ATSAnalysisSchema,
    status: {
      type: String,
      enum: [
        'applied',
        'submitted',
        'under_review',
        'shortlisted',
        'interview_scheduled',
        'interviewed',
        'offered',
        'hired',
        'rejected',
        'withdrawn',
      ],
      default: 'applied',
      index: true,
    },
    rejectionReason: String,
    finalScore: Number,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index: one application per candidate per job
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
