import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeAnalysis extends Document {
  resumeId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  atsScore: number;
  grammarScore: number;
  skillMatch: number;
  experienceScore: number;
  educationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: Date;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      unique: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    atsScore: {
      type: Number,
      required: true,
    },
    grammarScore: {
      type: Number,
      required: true,
    },
    skillMatch: {
      type: Number,
      required: true,
    },
    experienceScore: {
      type: Number,
      required: true,
    },
    educationScore: {
      type: Number,
      required: true,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ResumeAnalysis = mongoose.model<IResumeAnalysis>(
  'ResumeAnalysis',
  ResumeAnalysisSchema,
  'resume_analysis'
);
