'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.Interview = void 0;
const mongoose_1 = __importStar(require('mongoose'));
const InterviewQuestionSchema = new mongoose_1.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['technical', 'behavioral', 'situational', 'culture_fit'],
      default: 'technical',
    },
    weight: {
      type: Number,
      default: 1,
    },
    candidateAnswer: String,
    aiScore: Number,
    aiFeedback: String,
  },
  { _id: false }
);
const InterviewSchema = new mongoose_1.Schema(
  {
    applicationId: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
      index: true,
    },
    candidateId: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'evaluated', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
    },
    questions: [InterviewQuestionSchema],
    interviewType: {
      type: String,
      enum: ['ai_avatar', 'text_based', 'video_call'],
      default: 'ai_avatar',
    },
    duration: Number,
    invitedBy: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
exports.Interview = mongoose_1.default.model('Interview', InterviewSchema);
//# sourceMappingURL=Interview.js.map
