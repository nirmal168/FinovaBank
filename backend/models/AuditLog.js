const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit log action is required'],
      trim: true,
      index: true,
    },
    entity: {
      type: String,
      required: [true, 'Audit log entity is required'],
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
      trim: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize chronologically reverse queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entity: 1, action: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
