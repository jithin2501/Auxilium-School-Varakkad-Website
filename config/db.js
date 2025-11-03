// config/db.js
import mongoose from 'mongoose';

dotenv.config();

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => {
            console.error('❌ MongoDB error:', err.message);
            // Exit process on connection failure
            process.exit(1); 
        });
};

export default connectDB;