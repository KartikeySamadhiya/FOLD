const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const User = require('../models/User');

/**
 * Auth Controller
 *
 * SOLID - Single Responsibility:
 * This file handles ALL authentication business logic:
 * register, login (with brute-force protection), 2FA setup, and 2FA verification.
 *
 * It is intentionally kept separate from routes (which only define URLs)
 * and models (which only define data structure).
 */

// --- Helper: Generate a signed JWT ---
const generateToken = (id, expiresIn = '7d') => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// Max failed login attempts before account lock
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes


/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Create user — password is hashed automatically via the pre-save hook in User.js
        const user = await User.create({ name, email, password });

        // Return a token immediately so the user is logged in after registering
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};


/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT (or prompt for 2FA)
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        // Explicitly select password since it's hidden by default
        const user = await User.findOne({ email }).select('+password +twoFactorSecret');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // --- Brute-force protection ---
        if (user.isLocked()) {
            const waitMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                success: false,
                message: `Account is temporarily locked. Please try again in ${waitMins} minute(s).`,
            });
        }

        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            // Increment failed attempts
            user.loginAttempts += 1;
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                user.loginAttempts = 0; // Reset counter after locking
            }
            await user.save({ validateBeforeSave: false });
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Successful password check — reset login attempts
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save({ validateBeforeSave: false });

        // --- 2FA Check ---
        // If 2FA is enabled, we DON'T return the full JWT yet.
        // Instead, we return a short-lived "pre-auth" token that can
        // ONLY be used to submit a 2FA code, not to access protected routes.
        if (user.isTwoFactorEnabled) {
            const preAuthToken = generateToken(user._id, '5m'); // Expires in 5 minutes
            return res.status(200).json({
                success: true,
                requiresTwoFactor: true,
                preAuthToken, // Frontend uses this to call /verify-2fa-login
            });
        }

        // No 2FA — return the full JWT
        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            requiresTwoFactor: false,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};


/**
 * @route   POST /api/auth/verify-2fa-login
 * @desc    Verify TOTP code after successful password login
 * @access  Semi-public (requires the preAuthToken from /login)
 */
const verifyTwoFactorLogin = async (req, res) => {
    try {
        const { preAuthToken, totpCode } = req.body;

        if (!preAuthToken || !totpCode) {
            return res.status(400).json({ success: false, message: 'Pre-auth token and TOTP code are required.' });
        }

        // Verify the short-lived pre-auth token
        let decoded;
        try {
            decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: 'Pre-auth token is invalid or expired. Please log in again.' });
        }

        const user = await User.findById(decoded.id).select('+twoFactorSecret');
        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ success: false, message: 'Two-factor authentication is not set up for this account.' });
        }

        // Validate the 6-digit TOTP code against the stored secret
        const isValid = authenticator.verify({ token: totpCode, secret: user.twoFactorSecret });
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid or expired 2FA code. Please try again.' });
        }

        // 2FA passed — issue the full JWT
        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        });
    } catch (error) {
        console.error('Verify 2FA login error:', error);
        res.status(500).json({ success: false, message: 'Server error during 2FA verification.' });
    }
};


/**
 * @route   POST /api/auth/setup-2fa
 * @desc    Generate a 2FA secret and return a QR code for scanning
 * @access  Protected (must be logged in)
 */
const setupTwoFactor = async (req, res) => {
    try {
        const user = req.user; // Comes from the protect middleware

        // Generate a new TOTP secret
        const secret = authenticator.generateSecret();
        const appName = 'FOLD';
        const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);

        // Save the secret temporarily (not enabled until verified)
        user.twoFactorSecret = secret;
        await user.save({ validateBeforeSave: false });

        // Generate a QR code image (data URL) for the frontend to display
        const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

        res.status(200).json({
            success: true,
            message: 'Scan the QR code with your authenticator app, then verify with a code.',
            qrCode: qrCodeDataUrl,
            // Also expose manual key as fallback for users who can't scan
            manualEntryKey: secret,
        });
    } catch (error) {
        console.error('Setup 2FA error:', error);
        res.status(500).json({ success: false, message: 'Server error during 2FA setup.' });
    }
};


/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Verify a TOTP code and officially ENABLE 2FA on the account
 * @access  Protected
 */
const enableTwoFactor = async (req, res) => {
    try {
        const { totpCode } = req.body;
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        if (!user.twoFactorSecret) {
            return res.status(400).json({ success: false, message: 'Please initiate 2FA setup first via /setup-2fa.' });
        }

        const isValid = authenticator.verify({ token: totpCode, secret: user.twoFactorSecret });
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid code. Please check your authenticator app and try again.' });
        }

        // The user has proven they can generate valid codes — enable 2FA
        user.isTwoFactorEnabled = true;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: '2FA has been successfully enabled on your account!',
        });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({ success: false, message: 'Server error while enabling 2FA.' });
    }
};


/**
 * @route   GET /api/auth/me
 * @desc    Get the currently logged-in user's profile
 * @access  Protected
 */
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            isTwoFactorEnabled: req.user.isTwoFactorEnabled,
            createdAt: req.user.createdAt,
        },
    });
};


module.exports = {
    register,
    login,
    verifyTwoFactorLogin,
    setupTwoFactor,
    enableTwoFactor,
    getMe,
};
