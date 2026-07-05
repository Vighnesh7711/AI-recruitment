import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  status: 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'interview_scheduled' | 'selected';
  appliedOn: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['applied', 'under_review', 'shortlisted', 'rejected', 'interview_scheduled', 'selected'],
      default: 'applied',
      index: true,
    },
    appliedOn: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index on (candidateId, jobId)
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema, 'applications');
