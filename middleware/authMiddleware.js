// middleware/authMiddleware.js
// Extracted from admission.js
import dotenv from 'dotenv';
dotenv.config();

export const noCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

export const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'superadmin')) return next();
    if (req.xhr || req.headers.accept.includes('json')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    res.redirect('/admin'); 
};

export const isSuperAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'superadmin') return next();
    if (req.xhr || req.headers.accept.includes('json')) {
        return res.status(403).json({ success: false, message: 'Forbidden: Superadmin access required' });
    }
    res.status(403).redirect('/admin'); 
};