// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import path from 'path';
import { fileURLToPath } from 'url'; 

// --- Internal Imports ---
import connectDB from './config/db.js';
import { User } from './models/User.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; // This is where the new routes are imported

// --- Setup paths and environment ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Database Connection
connectDB();

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
    cookie: { secure: false, maxAge: 86400000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport local strategy with the User model
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 4. Route Mounting
// The `adminRoutes` and `publicRoutes` automatically handle the new API endpoints 
// (e.g., POST /admin/principal-message and GET /principal-message) as defined in the 
// preceding controller and route file updates.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', publicRoutes); // Mount all public routes (includes /principal-message)
app.use('/admin', adminRoutes); // Mount all admin routes (includes /admin/principal-message)

// 5. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('🔑 Admin portal: http://localhost:3000/admin');
});