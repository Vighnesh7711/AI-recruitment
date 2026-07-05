import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  education?: string;
  skills: string[];
  experience?: string;
  github?: string;
  linkedin?: string;
  createdAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      trim: true,
    },
    github: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema, 'candidates');
