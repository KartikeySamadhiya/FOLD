const mongoose = require('mongoose');

/**
 * SecureVault Schema
 *
 * Stores ONLY encrypted ciphertext. The server has zero knowledge of
 * the actual contents — the plaintext is encrypted in the user's
 * browser using AES-256-GCM before being sent here.
 *
 * Fields stored:
 *  - label: The item name (unencrypted, e.g. "Netflix Password"). 
 *           This is intentionally NOT encrypted so users can see 
 *           their item list without unlocking the vault.
 *  - encryptedData: The AES-256-GCM encrypted ciphertext (Base64)
 *  - iv: The Initialization Vector used during encryption (Base64).
 *        Required for decryption. Unique per item.
 *  - category: A tag to organize vault items (e.g. 'password', 'note', 'card')
 */
const secureVaultSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        label: {
            type: String,
            required: [true, 'A label is required for the vault item'],
            trim: true,
            maxlength: [100, 'Label cannot exceed 100 characters'],
        },
        // AES-256-GCM encrypted content (sent from the browser)
        encryptedData: {
            type: String,
            required: [true, 'Encrypted data is required'],
        },
        // The IV must be stored alongside the ciphertext for decryption
        iv: {
            type: String,
            required: [true, 'Initialization vector is required'],
        },
        category: {
            type: String,
            enum: ['password', 'secure-note', 'card', 'identity', 'other'],
            default: 'password',
        },
        // Icon/favicon URL for quick visual identification
        iconUrl: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const SecureVault = mongoose.model('SecureVault', secureVaultSchema);
module.exports = SecureVault;
