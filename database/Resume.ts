import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  candidateId: mongoose.Types.ObjectId;
  resumeUrl: string;
  extractedText?: string;
  atsScore?: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  uploadDate: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    extractedText: String,
    atsScore: Number,
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema, 'resumes');
