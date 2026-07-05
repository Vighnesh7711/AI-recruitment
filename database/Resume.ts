import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  candidateId: mongoose.Types.ObjectId;
  resumeUrl: string;
  uploadDate: Date;
  extractedText?: string;
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    extractedText: {
      type: String,
    },
    atsScore: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema);
