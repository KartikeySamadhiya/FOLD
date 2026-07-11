const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Auth Middleware
 *
 * SOLID - Single Responsibility:
 * This file has ONE job: verify that the incoming HTTP request
 * carries a valid JWT and attach the decoded user to req.user.
 * 
 * Any route that requires a logged-in user should use this middleware.
 * Usage in routes: router.get('/protected', protect, controllerFn)
 */
const protect = async (req, res, next) => {
    let token;

    // JWT is sent in the Authorization header as: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. No token provided.',
        });
    }

    try {
        // Verify the token signature and expiry using our JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user document to the request object for downstream use
        // We explicitly exclude the password field
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User belonging to this token no longer exists.',
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Token is invalid or expired.',
        });
    }
};

module.exports = { protect };
