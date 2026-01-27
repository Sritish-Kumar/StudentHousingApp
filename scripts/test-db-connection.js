const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Try to load .env.local manually since check is often helpful
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    console.log('Found .env.local, loading...');
    require('dotenv').config({ path: envLocalPath });
} else {
    console.log('.env.local not found, checking standard .env...');
    require('dotenv').config();
}

const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('MONGODB_URI defined:', !!uri);
if (uri) {
    // Log masked URI for verification
    const mask = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('Target URI:', mask);
}

if (!uri) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('Attempting to connect with mongoose...');
        await mongoose.connect(uri);
        console.log('Successfully connected to MongoDB!');
        await mongoose.disconnect();
        console.log('Disconnected.');
    } catch (error) {
        console.error('Connection failed:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testConnection();
