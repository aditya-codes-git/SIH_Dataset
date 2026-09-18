const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diabetic_retinopathy';
  console.log(`[DB] Attempting MongoDB connection to ${mongoURI}...`);

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout for local connection check
    });
    isConnected = true;
    connectionError = null;
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    console.error(`[DB ERROR] Failed to connect to MongoDB: ${error.message}`);
    console.error(`[DB ERROR] Database will be reported as UNAVAILABLE. Operations requiring database persistence will report database unavailable status.`);
    return false;
  }
};

const getDBStatus = () => {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    error: connectionError,
  };
};

module.exports = { connectDB, getDBStatus };
