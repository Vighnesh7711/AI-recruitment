import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionResponse extends Document {
  interviewId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  questionOrder: number;
  answer?: string;
  aiScore?: number;
  confidence?: number;
  feedback?: string;
  createdAt: Date;
}

const QuestionResponseSchema = new Schema<IQuestionResponse>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionBank',
      required: true,
      index: true,
    },
    questionOrder: {
      type: Number,
      required: true,
    },
    answer: String,
    aiScore: Number,
    confidence: Number,
    feedback: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

QuestionResponseSchema.index({ interviewId: 1, questionOrder: 1 }, { unique: true });

export const QuestionResponse = mongoose.model<IQuestionResponse>(
  'QuestionResponse',
  QuestionResponseSchema,
  'question_responses'
);
