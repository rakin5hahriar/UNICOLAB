const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const checkDbConnection = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Database Name:', conn.connection.name);
    console.log('Connection State:', conn.connection.readyState);
    
    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check if Users collection exists and count documents
    if (collections.some(c => c.name === 'users')) {
      const userCount = await conn.connection.db.collection('users').countDocuments();
      console.log('User count:', userCount);
    } else {
      console.log('Users collection does not exist yet');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

checkDbConnection(); 