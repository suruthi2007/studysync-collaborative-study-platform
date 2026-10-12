const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studysync';
    
    // Attempt standard connection first with 3s timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(` MongoDB Connected successfully to: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`! Standard MongoDB connection failed (${err.message}).`);
    console.log(' Starting in-memory embedded MongoDB server for instant zero-config testing...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(` In-Memory MongoDB running and connected at: ${memoryUri}`);
    } catch (memErr) {
      console.error(' Failed to initialize in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
