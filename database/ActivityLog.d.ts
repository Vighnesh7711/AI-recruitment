import mongoose, { Document } from 'mongoose';
export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
export declare const ActivityLog: mongoose.Model<
  IActivityLog,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IActivityLog, {}, {}> &
    IActivityLog &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=ActivityLog.d.ts.map
