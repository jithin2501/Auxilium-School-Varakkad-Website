// server.js
import express from 'express';
import cors from 'cors';
import session from 'express-session';
// <-- NEW/MODIFIED: Import the session store package
import MongoDBStore from 'connect-mongodb-session'; 
import passport from 'passport';
import LocalStrategy from 'passport-local';
import path from 'path';
import { fileURLToPath } from 'url'; 

// --- Internal Imports ---
import connectDB from './config/db.js';
import { User } from './models/User.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; 

// --- Setup paths and environment ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// <-- NEW/MODIFIED: Initialize the store function
const MongoStore = MongoDBStore(session); 

// 1. Database Connection
connectDB();

// <-- NEW/MODIFIED: Create the persistent store instance
const sessionStore = new MongoStore({
    uri: process.env.MONGO_URI,
    collection: 'adminSessions', // Sessions will be stored in a new collection called 'adminSessions'
});

// 2. Core Middleware Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'PUT'] })); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session and Passport Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // <-- MODIFIED: Use the persistent MongoStore instead of MemoryStore
    store: sessionStore, 
    cookie: { secure: false, maxAge: 86400000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport local strategy with the User model
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 4. Route Mounting
// Serve static assets (index.html, script.js, css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// API and backend routes
app.use('/', publicRoutes); 
app.use('/admin', adminRoutes); 


// 🎯 CRITICAL FIX: SPA FALLBACK ROUTE (Using named parameter to avoid PathError)
// This route must be the LAST one defined. It catches any non-matching path.
app.get('/:all*', (req, res) => {
    // Send the single index.html file for all remaining requests, 
    // letting the client-side JavaScript router handle the content display.
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// 5. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('🔑 Admin portal: http://localhost:3000/admin');
});