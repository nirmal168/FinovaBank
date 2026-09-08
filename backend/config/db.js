const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Warning: Connection failed: ${error.message}`);
    console.warn(`[MongoDB] The server will continue running, but database operations will be unavailable until MongoDB is running.`);
    return null;
  }
};

module.exports = connectDB;
