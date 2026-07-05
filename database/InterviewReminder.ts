import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewReminder extends Document {
  interviewId: mongoose.Types.ObjectId;
  emailSent: boolean;
  whatsappSent: boolean;
  smsSent: boolean;
  scheduledTime: Date;
}

const InterviewReminderSchema = new Schema<IInterviewReminder>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
      required: true,
    },
    whatsappSent: {
      type: Boolean,
      default: false,
      required: true,
    },
    smsSent: {
      type: Boolean,
      default: false,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const InterviewReminder = mongoose.model<IInterviewReminder>(
  'InterviewReminder',
  InterviewReminderSchema,
  'interview_reminders'
);
