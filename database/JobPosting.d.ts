import mongoose, { Document } from 'mongoose';
export interface IJobPosting extends Document {
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  department?: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  companyId?: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  status: 'draft' | 'active' | 'paused' | 'closed';
  applicationDeadline?: Date;
  applicationCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export declare const JobPosting: mongoose.Model<
  IJobPosting,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, IJobPosting, {}, {}> &
    IJobPosting &
    Required<{
      _id: mongoose.Types.ObjectId;
    }> & {
      __v: number;
    },
  any
>;
//# sourceMappingURL=JobPosting.d.ts.map
