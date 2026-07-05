import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailNotification extends Document {
  candidateId: mongoose.Types.ObjectId;
  type: 'welcome' | 'rejection' | 'shortlisted' | 'interview_invite' | 'reminder' | 'offer';
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  sentTime?: Date;
}

const EmailNotificationSchema = new Schema<IEmailNotification>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['welcome', 'rejection', 'shortlisted', 'interview_invite', 'reminder', 'offer'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      required: true,
    },
    sentTime: Date,
  },
  {
    timestamps: false,
  }
);

export const EmailNotification = mongoose.model<IEmailNotification>(
  'EmailNotification',
  EmailNotificationSchema,
  'email_notifications'
);
