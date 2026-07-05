import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewEvaluation extends Document {
  interviewId: mongoose.Types.ObjectId;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  grammarScore: number;
  problemSolvingScore: number;
  behavioralScore: number;
  overallScore: number;
  recommendation: string;
  feedback: string;
  createdAt: Date;
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
    technicalScore: {
      type: Number,
      required: true,
    },
    communicationScore: {
      type: Number,
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
    },
    grammarScore: {
      type: Number,
      required: true,
    },
    problemSolvingScore: {
      type: Number,
      required: true,
    },
    behavioralScore: {
      type: Number,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const InterviewEvaluation = mongoose.model<IInterviewEvaluation>(
  'InterviewEvaluation',
  InterviewEvaluationSchema,
  'interview_evaluations'
);
