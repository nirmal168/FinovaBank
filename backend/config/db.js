const mongoose = require('mongoose');

// Auto-sanitize MongoDB URI (strips accidental < > brackets and encodes special chars in passwords)
const sanitizeMongoUri = (rawUri) => {
  if (!rawUri) return rawUri;
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@\/]+)(.*)$/);
  if (!match) return rawUri;
  const [, protocol, user, passRaw, host, rest] = match;
  const pass = passRaw.replace(/^<|>$/g, '');
  return `${protocol}${encodeURIComponent(decodeURIComponent(user))}:${encodeURIComponent(decodeURIComponent(pass))}@${host}${rest}`;
};

let lastDbError = null;

const connectDB = async () => {
  const rawUri = process.env.MONGO_URI;
  const uri = sanitizeMongoUri(rawUri);
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
    });
    lastDbError = null;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    lastDbError = error.message;
    console.warn(`[MongoDB] Warning: Connection failed: ${error.message}`);
    console.warn(`[MongoDB] The server will continue running, but database operations will be unavailable until MongoDB is running.`);
    
    // Attempt background reconnect after 5s
    setTimeout(async () => {
      try {
        console.log('[MongoDB] Retrying database connection...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
        lastDbError = null;
        console.log('[MongoDB] Connected successfully on retry.');
      } catch (retryErr) {
        lastDbError = retryErr.message;
        console.warn(`[MongoDB] Reconnect attempt failed: ${retryErr.message}`);
      }
    }, 5000);
    
    return null;
  }
};

const getDbDiagnostics = () => {
  const raw = process.env.MONGO_URI || '';
  const masked = raw.replace(/:([^:@]+)@/, ':***@');
  return {
    configured: Boolean(raw),
    maskedUri: masked,
    lastError: lastDbError,
  };
};

module.exports = connectDB;
module.exports.getDbDiagnostics = getDbDiagnostics;


