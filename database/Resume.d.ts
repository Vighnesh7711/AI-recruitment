import mongoose, { Document } from 'mongoose';
export interface IResume extends Document {
  candidateId: mongoose.Types.ObjectId;
  resumeUrl: string;
  uploadDate: Date;
  extractedText?: string;
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}
export declare const Resume: mongoose.Model<
  IResume,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IResume, {}, {}> &
    IResume &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=Resume.d.ts.map
