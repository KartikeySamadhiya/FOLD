const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'A connection must have a name'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        nickname: {
            type: String,
            trim: true,
            maxlength: 50,
        },
        photo: {
            type: String, // base64 data URL or external URL
            default: '',
        },
        relationship: {
            type: String,
            enum: ['friend', 'family', 'colleague', 'acquaintance', 'mentor', 'partner', 'other'],
            default: 'friend',
        },
        dateOfBirth: {
            type: Date,
        },
        metOn: {
            date: { type: Date },
            place: { type: String, trim: true },
            context: { type: String, trim: true }, // e.g. "College orientation"
        },
        location: {
            type: String, // Where they live
            trim: true,
        },
        notes: {
            type: String, // Personal views/thoughts about them
            default: '',
        },
        socialLinks: [
            {
                platform: {
                    type: String,
                    enum: ['instagram', 'twitter', 'linkedin', 'github', 'facebook', 'snapchat', 'discord', 'whatsapp', 'website', 'other'],
                },
                url: { type: String, trim: true },
            },
        ],
        reminders: [
            {
                title: { type: String, required: true, trim: true },
                date: { type: Date, required: true },
                recurring: { type: Boolean, default: false }, // e.g. birthday repeats yearly
            },
        ],
        isFavorite: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

connectionSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
