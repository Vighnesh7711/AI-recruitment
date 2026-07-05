import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeAnalysis extends Document {
  resumeId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
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
    matchedSkills: [String],
    missingSkills: [String],
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
  },
  {
    timestamps: true,
  }
);

export const ResumeAnalysis = mongoose.model<IResumeAnalysis>(
  'ResumeAnalysis',
  ResumeAnalysisSchema
);
