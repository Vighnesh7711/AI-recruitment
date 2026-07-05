import mongoose, { Document } from 'mongoose';
export interface IInterviewEvaluation extends Document {
  interviewId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  confidenceScore: number;
  overallInterviewScore: number;
  atsScore: number;
  finalWeightedScore: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire';
  hrDecision?: 'approved' | 'rejected' | 'pending';
  hrNotes?: string;
  decidedBy?: mongoose.Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export declare const InterviewEvaluation: mongoose.Model<
  IInterviewEvaluation,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IInterviewEvaluation, {}, {}> &
    IInterviewEvaluation &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=InterviewEvaluation.d.ts.map
