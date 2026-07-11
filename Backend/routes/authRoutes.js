const express = require('express');
const router = express.Router();

const {
    register,
    login,
    verifyTwoFactorLogin,
    setupTwoFactor,
    enableTwoFactor,
    getMe,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

/**
 * Auth Routes
 *
 * SOLID - Single Responsibility:
 * This file ONLY defines what URL maps to what controller function.
 * Zero business logic lives here.
 *
 * Public routes (no JWT required):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/verify-2fa-login
 *
 * Protected routes (requires valid JWT via the `protect` middleware):
 *   GET  /api/auth/me
 *   POST /api/auth/setup-2fa
 *   POST /api/auth/enable-2fa
 */

// --- Public Routes ---
router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa-login', verifyTwoFactorLogin);

// --- Protected Routes ---
router.get('/me', protect, getMe);
router.post('/setup-2fa', protect, setupTwoFactor);
router.post('/enable-2fa', protect, enableTwoFactor);

module.exports = router;
