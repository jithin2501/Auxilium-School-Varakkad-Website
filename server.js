// server.js
import express from 'express';
import cors from 'cors';
import session from 'express-session';
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

// --- Setup paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- MongoDB Session Store ---
const MongoStore = MongoDBStore(session);

// Connect to MongoDB
connectDB();

// Create persistent session store
const sessionStore = new MongoStore({
    uri: process.env.MONGO_URI,
    collection: 'adminSessions',
});

// --- Core Middleware ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'PUT'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session + Passport ---
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            secure: false, // keep false on Render (no HTTPS termination here)
            maxAge: 86400000,
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// ✅ SEO FILES (VERY IMPORTANT)
// ================================

// Serve sitemap.xml (must be BEFORE routes)
app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Serve robots.txt
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// --- MAIN ROUTES ---
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// --- SPA / FALLBACK ---
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔐 Admin portal: http://localhost:${PORT}/admin`);
});
