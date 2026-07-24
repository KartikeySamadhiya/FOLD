const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();

// --- Connect to Database ---
connectDB();

// --- Core Middleware ---
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Allows large payloads for media uploads
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/calendar', calendarRoutes);

// --- Health Check Route ---
app.get('/', (req, res) => {
    res.json({ success: true, message: 'FOLD API is running securely!' });
});

// --- 404 Handler (must be AFTER all routes) ---
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// --- Global Error Handler (must be AFTER 404 handler) ---
// Express recognizes a middleware with 4 params as an error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`FOLD Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});