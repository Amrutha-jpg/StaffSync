const mongoose = require('mongoose');

const connectDB = async (retries = 10, delay = 2000) => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/staffsync';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`⚠️  MongoDB attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        console.error('❌ Could not connect to MongoDB after multiple attempts. Exiting.');
        process.exit(1);
      }
      console.log(`🔄 Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

module.exports = connectDB;
