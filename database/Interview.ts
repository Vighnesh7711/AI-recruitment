import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewQuestion {
  questionId: string;
  text: string;
  category: 'technical' | 'behavioral' | 'situational' | 'culture_fit';
  weight: number;
  candidateAnswer?: string;
  aiScore?: number;
  aiFeedback?: string;
}

export interface IInterview extends Document {
  applicationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  token: string;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated' | 'cancelled' | 'expired';
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  questions: IInterviewQuestion[];
  interviewType: 'ai_avatar' | 'text_based' | 'video_call';
  duration?: number;
  invitedBy: mongoose.Types.ObjectId;
  calendarSynced?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    questionId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['technical', 'behavioral', 'situational', 'culture_fit'],
      default: 'technical',
    },
    weight: {
      type: Number,
      default: 1,
    },
    candidateAnswer: String,
    aiScore: Number,
    aiFeedback: String,
  },
  { _id: false }
);

const InterviewSchema = new Schema<IInterview>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'evaluated', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
    },
    questions: [InterviewQuestionSchema],
    interviewType: {
      type: String,
      enum: ['ai_avatar', 'text_based', 'video_call'],
      default: 'ai_avatar',
    },
    duration: Number,
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    calendarSynced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
