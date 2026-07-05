import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type:
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'application_update'
    | 'interview_invite'
    | 'evaluation_ready';
  link?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export declare const Notification: mongoose.Model<
  INotification,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, INotification, {}, {}> &
    INotification &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=Notification.d.ts.map
