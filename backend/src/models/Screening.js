const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema(
  {
    screeningId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patientId: {
      type: String,
      default: 'PATIENT-ANONYMOUS',
      index: true,
    },
    patientName: {
      type: String,
      default: 'Anonymous Patient',
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: 'Unspecified',
    },
    diabetesDuration: {
      type: String,
      default: 'Not specified',
    },
    contactLocation: {
      type: String,
      default: 'Rural Screening Camp',
    },
    originalImagePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['GRADABLE', 'UNGRADABLE', 'FAILED'],
    },
    quality: {
      gradable: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      focusScore: { type: Number, default: 0 },
      brightness: { type: Number, default: 0 },
      fovRatio: { type: Number, default: 0 },
    },
    drGrade: {
      type: Number,
      default: null,
    },
    predictedClass: {
      type: String,
      default: null,
    },
    confidence: {
      type: Number,
      default: null,
    },
    referable: {
      type: Boolean,
      default: null,
    },
    referral: {
      type: String,
      default: null,
    },
    triage: {
      referralRequired: { type: Boolean, default: false },
      priority: {
        type: String,
        enum: ['ROUTINE', 'MEDIUM', 'HIGH', 'URGENT', 'RECAPTURE_REQUIRED'],
        default: 'ROUTINE',
      },
      routing: {
        type: String,
        enum: ['ROUTINE_FOLLOW_UP', 'OPHTHALMOLOGIST_REVIEW', 'RECAPTURE'],
        default: 'ROUTINE_FOLLOW_UP',
      },
      status: {
        type: String,
        enum: ['NOT_REQUIRED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'REVIEWED', 'COMPLETED', 'UNGRADABLE'],
        default: 'NOT_REQUIRED',
      },
    },
    gradcamImagePath: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      default: null,
    },
    humanReview: {
      reviewed: { type: Boolean, default: false },
      reviewer: { type: String, default: null },
      decision: { type: String, default: null },
      notes: { type: String, default: null },
      reviewedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Screening', screeningSchema);
