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

const connectDB = async () => {
  const uri = sanitizeMongoUri(process.env.MONGO_URI);
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Warning: Connection failed: ${error.message}`);
    console.warn(`[MongoDB] The server will continue running, but database operations will be unavailable until MongoDB is running.`);
    
    // Attempt background reconnect after 5s
    setTimeout(async () => {
      try {
        console.log('[MongoDB] Retrying database connection...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
        console.log('[MongoDB] Connected successfully on retry.');
      } catch (retryErr) {
        console.warn(`[MongoDB] Reconnect attempt failed: ${retryErr.message}`);
      }
    }, 5000);
    
    return null;
  }
};

module.exports = connectDB;

