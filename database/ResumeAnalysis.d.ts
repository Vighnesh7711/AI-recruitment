import mongoose, { Document } from 'mongoose';
export interface IResumeAnalysis extends Document {
  resumeId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}
export declare const ResumeAnalysis: mongoose.Model<
  IResumeAnalysis,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IResumeAnalysis, {}, {}> &
    IResumeAnalysis &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=ResumeAnalysis.d.ts.map
