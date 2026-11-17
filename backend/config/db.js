const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connect to MongoDB. Exits the process on initial connection failure
 * so the container/PM2 can restart cleanly rather than serving requests
 * against an unconnected database.
 */


const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not set in environment');
    process.exit(1);
  }

  



  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✓ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠ MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });
};

module.exports = connectDB;
