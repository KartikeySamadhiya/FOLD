const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * ShareLink Schema
 *
 * Powers the "Burn After Reading" and "Time Bomb" sharing features.
 * When a user shares a vault item, a ShareLink document is created with
 * a unique token. The recipient visits /secret/:token and the backend:
 *   1. Finds this document by token
 *   2. Checks if it has expired or been used up
 *   3. Returns the encrypted data (the recipient's browser decrypts it)
 *   4. Increments viewCount and deletes the document if maxViews is reached
 */
const shareLinkSchema = new mongoose.Schema(
    {
        // Reference to the vault item being shared
        vaultItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SecureVault',
            required: true,
        },
        // The encrypted data is duplicated here so the vault item
        // can be deleted independently of active share links
        encryptedData: {
            type: String,
            required: true,
        },
        iv: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        // Unique, cryptographically random token for the share URL
        token: {
            type: String,
            unique: true,
            default: () => crypto.randomBytes(32).toString('hex'),
            index: true,
        },
        // When this link expires (null = never expires, only view-limited)
        expiresAt: {
            type: Date,
            default: null,
        },
        // Maximum number of views before self-destructing (1 = burn after reading)
        maxViews: {
            type: Number,
            default: 1,
            min: 1,
        },
        // How many times this link has been accessed
        viewCount: {
            type: Number,
            default: 0,
        },
        // Creator reference for audit log
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Virtual to check if a link is still valid (not expired and not over view limit)
shareLinkSchema.virtual('isValid').get(function () {
    const notExpired = !this.expiresAt || this.expiresAt > new Date();
    const notOverLimit = this.viewCount < this.maxViews;
    return notExpired && notOverLimit;
});

// TTL Index: MongoDB will AUTOMATICALLY delete expired documents.
// This is a failsafe in case the app server misses a deletion.
shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);
module.exports = ShareLink;
