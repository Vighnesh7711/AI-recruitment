import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewReminder extends Document {
  interviewId: mongoose.Types.ObjectId;
  scheduledTime: Date;
  candidateEmailSent: boolean;
  hrEmailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewReminderSchema = new Schema<IInterviewReminder>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
    candidateEmailSent: {
      type: Boolean,
      default: false,
    },
    hrEmailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const InterviewReminder = mongoose.model<IInterviewReminder>(
  'InterviewReminder',
  InterviewReminderSchema
);
