import mongoose, { Document } from 'mongoose';
export interface IATSAnalysis {
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: number;
  educationMatch: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  resumePath?: string;
  resumeOriginalName?: string;
  coverLetter?: string;
  parsedResume?: Record<string, unknown>;
  atsScore?: number;
  atsAnalysis?: IATSAnalysis;
  status:
    | 'applied'
    | 'submitted'
    | 'under_review'
    | 'shortlisted'
    | 'interview_scheduled'
    | 'interviewed'
    | 'offered'
    | 'hired'
    | 'rejected'
    | 'withdrawn';
  rejectionReason?: string;
  finalScore?: number;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export declare const Application: mongoose.Model<
  IApplication,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IApplication, {}, {}> &
    IApplication &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=Application.d.ts.map
