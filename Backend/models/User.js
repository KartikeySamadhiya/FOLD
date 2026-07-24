const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * 
 * SOLID: Single Responsibility - this model ONLY defines the
 * user data structure and password-related instance methods.
 * All business logic lives in the controller.
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Never return password in queries by default
        },
        // 2FA fields
        twoFactorSecret: {
            type: String,
            select: false, // Never expose the 2FA secret
        },
        isTwoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        // Tracks failed login attempts for brute-force protection
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// --- Pre-save Hook ---
// Hash the password automatically before saving. This ensures
// we NEVER store plain-text passwords in the database.
userSchema.pre('save', async function () {
    // Only re-hash if the password field was actually modified
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// --- Instance Methods ---
// Check if the account is currently locked due to too many failed attempts
userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Compare a plain-text password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
