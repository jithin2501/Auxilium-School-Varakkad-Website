import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

// Define User model temporarily for the script
const UserSchema = new mongoose.Schema({
    role: { 
        type: String, 
        enum: ['admin', 'guest', 'superadmin'], 
        default: 'guest' 
    }
});
UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', UserSchema);


// MODIFIED: Get credentials from environment variables instead of hardcoding
const username = process.env.SUPERADMIN_USERNAME;
const password = process.env.SUPERADMIN_PASSWORD;

// --- Pre-flight Checks ---

if (!username || !password) {
    console.error("FATAL ERROR: SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD is missing in .env file.");
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is missing in .env file.");
    process.exit(1);
}

// --- Database Connection and User Creation ---

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB. Attempting to create superadmin user...');
        
        // Use the credentials loaded from the environment
        User.register(new User({ username, role: 'superadmin' }), password, (err, user) => {
            if (err) {
                if (err.name === 'UserExistsError') {
                    console.log(`\nUser '${username}' already exists. No action taken.`);
                } else {
                    console.error('\nError creating admin:', err.message);
                }
                mongoose.connection.close();
                return;
            }
            
            console.log(`\n✅ Superadmin user '${username}' created successfully!`);
            console.log(`Role: superadmin`);
            console.log(`Note: The password is **hashed** and securely stored.`);
            console.log(`Use the password from your .env file to log in.`);
            console.log(`Run 'node admission.js' to start the server.`);
            mongoose.connection.close();
        });
    })
    .catch(err => console.error('MongoDB connection error:', err.message));

// NOTE: The redundant code at the end has been removed.