const mongoose = require('mongoose');

/**
 * MemoryNote Schema
 *
 * Represents a single diary entry / memory card in the Workspace.
 * SOLID: This model is ONLY responsible for the structure of a memory note.
 * The dateFor field is what powers the calendar navigation feature —
 * when a user clicks a date, we query notes where dateFor matches.
 */
const memoryNoteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true, // Index for fast lookup by user
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
            default: '',
        },
        // Stores rich-text HTML from the editor (react-quill / tiptap)
        content: {
            type: String,
            default: '',
        },
        // Cloudinary URLs for attached images/videos
        mediaUrls: [
            {
                url: { type: String, required: true },
                mediaType: { type: String, enum: ['image', 'video'], required: true },
                publicId: { type: String }, // Cloudinary public_id for deletion
            },
        ],
        // The calendar day this note belongs to (stored as UTC midnight)
        dateFor: {
            type: Date,
            required: true,
            index: true, // Index for fast calendar-based lookups
        },
        // Google Keep style features
        isPinned: {
            type: Boolean,
            default: false,
        },
        color: {
            type: String,
            default: 'default', // e.g. 'default', 'red', 'blue', 'green', 'yellow'
        },
        tags: [
            {
                type: String,
                trim: true,
                maxlength: 30,
            },
        ],
        // Soft delete - marked as deleted but not removed from DB
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: efficiently fetch all notes for a user on a specific date
memoryNoteSchema.index({ userId: 1, dateFor: 1 });

const MemoryNote = mongoose.model('MemoryNote', memoryNoteSchema);
module.exports = MemoryNote;
