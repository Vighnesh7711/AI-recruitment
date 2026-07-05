import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewEvaluation extends Document {
  interviewId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  confidenceScore: number;
  overallInterviewScore: number;
  atsScore: number;
  finalWeightedScore: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire';
  hrDecision?: 'approved' | 'rejected' | 'pending';
  hrNotes?: string;
  decidedBy?: mongoose.Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewEvaluationSchema = new Schema<IInterviewEvaluation>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    technicalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    communicationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    problemSolvingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    cultureFitScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    overallInterviewScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // finalWeightedScore = 0.3 * atsScore + 0.7 * overallInterviewScore
    finalWeightedScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    strengths: [String],
    weaknesses: [String],
    summary: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      enum: ['strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire'],
      default: 'maybe',
    },
    hrDecision: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
      index: true,
    },
    hrNotes: String,
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    decidedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const InterviewEvaluation = mongoose.model<IInterviewEvaluation>(
  'InterviewEvaluation',
  InterviewEvaluationSchema,
  'interview_evaluations'
);
