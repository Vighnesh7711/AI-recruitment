import mongoose, { Schema, Document } from 'mongoose';

export interface IInterview extends Document {
  applicationId: mongoose.Types.ObjectId;
  schedule: Date;
  durationMinutes: number;
  meetingLink?: string;
  reminderSent: boolean;
  overallScore?: number;
  result: 'pending' | 'selected' | 'rejected';
  createdAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
      index: true,
    },
    schedule: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    meetingLink: String,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    overallScore: Number,
    result: {
      type: String,
      enum: ['pending', 'selected', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema, 'interviews');
