const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            trim: true,
            maxlength: [150, 'Title cannot exceed 150 characters'],
        },
        content: {
            type: String,
            default: '',
        },
        photos: [
            {
                url: { type: String, required: true },
                caption: { type: String, default: '' },
            },
        ],
        mood: {
            type: String,
            enum: ['happy', 'neutral', 'sad', 'excited', 'reflective', 'anxious', 'grateful'],
            default: 'neutral',
        },
        date: {
            type: Date,
            required: [true, 'A journal entry must have a date'],
            index: true,
        },
        tags: [{ type: String, trim: true, lowercase: true }],
    },
    {
        timestamps: true,
    }
);

// Compound index for fast lookups: "all entries by this user for this month"
journalEntrySchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
