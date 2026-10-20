const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Resolve to IPv4 explicitly for local dev; in production use MONGO_URI as-is
    const uri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/staffsync')
      .replace('localhost', '127.0.0.1');

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
