import mongoose, { Document } from 'mongoose';
export interface IInterviewQuestion {
  questionId: string;
  text: string;
  category: 'technical' | 'behavioral' | 'situational' | 'culture_fit';
  weight: number;
  candidateAnswer?: string;
  aiScore?: number;
  aiFeedback?: string;
}
export interface IInterview extends Document {
  applicationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  token: string;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated' | 'cancelled' | 'expired';
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  questions: IInterviewQuestion[];
  interviewType: 'ai_avatar' | 'text_based' | 'video_call';
  duration?: number;
  invitedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export declare const Interview: mongoose.Model<
  IInterview,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IInterview, {}, {}> &
    IInterview &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=Interview.d.ts.map
