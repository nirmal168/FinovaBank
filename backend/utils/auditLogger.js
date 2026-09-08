const AuditLog = require('../models/AuditLog');

// Regular expression to identify confidential credentials and sensitive keys
const SENSITIVE_KEY_PATTERN = /password|secret|token|otp|pin|cvv|authorization|cookie|passphrase|privatekey/i;

/**
 * Deeply sanitizes metadata objects, stripping or masking any sensitive authentication tokens,
 * passwords, OTPs, PINs, and payment credentials.
 */
function sanitizeMetadata(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeMetadata);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Centrally log an institutional audit event
 * @param {Object} params
 * @param {Object} [params.req] - Express request object for IP and User-Agent extraction
 * @param {string|ObjectId} [params.user] - User ID
 * @param {string} params.action - Action identifier (e.g., 'USER_LOGIN', 'DEPOSIT')
 * @param {string} params.entity - Entity category (e.g., 'User', 'Account', 'Transaction')
 * @param {string|ObjectId} [params.entityId] - Affected record ID
 * @param {string} [params.ipAddress] - Optional explicit IP override
 * @param {string} [params.userAgent] - Optional explicit User-Agent override
 * @param {Object} [params.metadata] - Action context attributes
 */
const logAuditEvent = async ({
  req,
  user,
  action,
  entity,
  entityId,
  ipAddress,
  userAgent,
  metadata = {},
}) => {
  try {
    const resolvedUser = user?._id || user || req?.user?._id || null;
    const resolvedIp =
      ipAddress ||
      req?.ip ||
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';
    const resolvedAgent = userAgent || req?.headers?.['user-agent'] || 'SecureBank System/API';
    const cleanMetadata = sanitizeMetadata(metadata);

    const logEntry = await AuditLog.create({
      user: resolvedUser,
      action,
      entity,
      entityId: entityId ? entityId.toString() : null,
      ipAddress: resolvedIp,
      userAgent: resolvedAgent,
      metadata: cleanMetadata,
      timestamp: new Date(),
    });

    return logEntry;
  } catch (err) {
    console.warn('[AuditLogger] Warning: Failed to record audit log:', err.message);
    return null;
  }
};

module.exports = {
  logAuditEvent,
  sanitizeMetadata,
};
