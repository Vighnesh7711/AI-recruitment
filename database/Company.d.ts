import mongoose, { Document } from 'mongoose';
export interface ICompany extends Document {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  location?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export declare const Company: mongoose.Model<
  ICompany,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, ICompany, {}, {}> &
    ICompany &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=Company.d.ts.map
