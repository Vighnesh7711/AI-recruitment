import mongoose, { Document } from 'mongoose';
export interface IInterviewReminder extends Document {
  interviewId: mongoose.Types.ObjectId;
  scheduledTime: Date;
  candidateEmailSent: boolean;
  hrEmailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export declare const InterviewReminder: mongoose.Model<
  IInterviewReminder,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IInterviewReminder, {}, {}> &
    IInterviewReminder &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=InterviewReminder.d.ts.map
