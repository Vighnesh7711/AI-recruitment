import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'hr' | 'candidate';
  phone?: string;
  avatarUrl?: string;
  companyId?: mongoose.Types.ObjectId;
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  hrProfile?: {
    designation?: string;
  };
  candidateProfile?: Record<string, unknown>;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export declare const User: mongoose.Model<
  IUser,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IUser, {}, {}> &
    IUser &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=User.d.ts.map
