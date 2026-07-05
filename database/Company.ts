import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  companyName: string;
  website?: string;
  industry?: string;
  logo?: string; // Cloudinary URL
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    website: String,
    industry: String,
    logo: String,
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema, 'companies');
