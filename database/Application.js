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
exports.Application = void 0;
const mongoose_1 = __importStar(require('mongoose'));
const ATSAnalysisSchema = new mongoose_1.Schema(
  {
    overallScore: Number,
    matchedSkills: [String],
    missingSkills: [String],
    experienceMatch: Number,
    educationMatch: Number,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
  },
  { _id: false }
);
const ApplicationSchema = new mongoose_1.Schema(
  {
    jobId: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumePath: String,
    resumeOriginalName: String,
    coverLetter: String,
    parsedResume: mongoose_1.Schema.Types.Mixed,
    atsScore: Number,
    atsAnalysis: ATSAnalysisSchema,
    status: {
      type: String,
      enum: [
        'applied',
        'submitted',
        'under_review',
        'shortlisted',
        'interview_scheduled',
        'interviewed',
        'offered',
        'hired',
        'rejected',
        'withdrawn',
      ],
      default: 'applied',
      index: true,
    },
    rejectionReason: String,
    finalScore: Number,
    reviewedBy: {
      type: mongoose_1.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);
// Compound index: one application per candidate per job
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
exports.Application = mongoose_1.default.model('Application', ApplicationSchema);
//# sourceMappingURL=Application.js.map
