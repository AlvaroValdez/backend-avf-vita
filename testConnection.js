require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📊 Collections:', collections.map(c => c.name));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

testConnection();