const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'A reminder must have a title'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        date: {
            type: Date,
            required: [true, 'A reminder must have a date'],
            index: true,
        },
        time: {
            type: String, // e.g. "14:30"
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
        completed: {
            type: Boolean,
            default: false,
        },
        recurring: {
            type: String,
            enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
            default: 'none',
        },
    },
    {
        timestamps: true,
    }
);

reminderSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
