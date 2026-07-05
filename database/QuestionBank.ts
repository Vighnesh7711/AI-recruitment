import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionBank extends Document {
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  expectedAnswer: string;
  keywords: string[];
}

const QuestionBankSchema = new Schema<IQuestionBank>(
  {
    domain: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    expectedAnswer: {
      type: String,
      required: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: false,
  }
);

export const QuestionBank = mongoose.model<IQuestionBank>(
  'QuestionBank',
  QuestionBankSchema,
  'question_bank'
);
