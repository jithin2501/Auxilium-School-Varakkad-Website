// config/db.js
import mongoose from 'mongoose';

// Removed: dotenv.config();

const connectDB = () => {
    // process.env.MONGO_URI is now provided directly by the Render environment
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => {
            console.error('❌ MongoDB error:', err.message);
            // Exit process on connection failure
            process.exit(1); 
        });
};

export default connectDB;