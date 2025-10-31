// models/User.js
import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const UserSchema = new mongoose.Schema({
    role: { 
        type: String, 
        // Must include 'superadmin' to align with createAdmin.js and admin logic
        enum: ['admin', 'guest', 'superadmin'], 
        default: 'guest' 
    },
    lastLogin: { 
        type: Date 
    }
});

UserSchema.plugin(passportLocalMongoose);

export const User = mongoose.model('User', UserSchema);