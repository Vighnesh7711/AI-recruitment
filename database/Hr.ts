import mongoose, { Schema, Document } from 'mongoose';

export interface IHr extends Document {
  userId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  name: string;
  designation?: string;
  profilePicture?: string;
  createdAt: Date;
}

const HrSchema = new Schema<IHr>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Hr = mongoose.model<IHr>('Hr', HrSchema, 'hr');
