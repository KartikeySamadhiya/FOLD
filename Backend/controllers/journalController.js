const JournalEntry = require('../models/JournalEntry');
const imagekit = require('../utils/imagekit');

// Helper function to upload files to ImageKit
const uploadToImageKit = async (files) => {
    const uploadPromises = files.map(file => {
        return imagekit.upload({
            file: file.buffer,
            fileName: file.originalname || 'fold_image.jpg',
            folder: "/fold_journal",
        });
    });
    const results = await Promise.all(uploadPromises);
    return results.map(result => ({ url: result.url, caption: '' }));
};

// @desc    Create a new journal entry
// @route   POST /api/journal
// @access  Private
exports.createEntry = async (req, res) => {
    try {
        const { title, content, mood, date, tags, existingPhotos } = req.body;
        
        let photos = [];
        
        // Add existing photos if passed from frontend (fallback)
        if (existingPhotos) {
            photos = [...JSON.parse(existingPhotos)];
        }

        // Upload new files
        if (req.files && req.files.length > 0) {
            const uploadedPhotos = await uploadToImageKit(req.files);
            photos = [...photos, ...uploadedPhotos];
        } else if (req.body.photos && typeof req.body.photos === 'string') {
            // Fallback for legacy base64 if not fully migrated
            photos.push({ url: req.body.photos, caption: '' });
        }

        const entry = await JournalEntry.create({
            userId: req.user._id,
            title,
            content,
            photos,
            mood: mood || 'neutral',
            date,
            tags: tags ? JSON.parse(tags) : [],
        });

        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        console.error('Create Entry Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get journal entries for a given month/year
// @route   GET /api/journal?month=7&year=2026
// @access  Private
exports.getEntries = async (req, res) => {
    try {
        const { month, year } = req.query;

        let query = { userId: req.user._id };

        // If month and year provided, filter to that month
        if (month && year) {
            const startDate = new Date(year, month - 1, 1); // months are 0-indexed
            const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
            query.date = { $gte: startDate, $lte: endDate };
        }

        const entries = await JournalEntry.find(query).sort({ date: -1 });
        res.json({ success: true, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get entries for a specific date
// @route   GET /api/journal/date/:date  (date format: YYYY-MM-DD)
// @access  Private
exports.getEntriesByDate = async (req, res) => {
    try {
        const dateParam = req.params.date; // "2026-07-23"
        const start = new Date(dateParam);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateParam);
        end.setHours(23, 59, 59, 999);

        const entries = await JournalEntry.find({
            userId: req.user._id,
            date: { $gte: start, $lte: end },
        }).sort({ createdAt: -1 });

        res.json({ success: true, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a journal entry
// @route   PUT /api/journal/:id
// @access  Private
exports.updateEntry = async (req, res) => {
    try {
        const { title, content, mood, date, tags, existingPhotos } = req.body;
        
        let photos = [];
        if (existingPhotos) {
            photos = [...JSON.parse(existingPhotos)];
        }

        if (req.files && req.files.length > 0) {
            const uploadedPhotos = await uploadToImageKit(req.files);
            photos = [...photos, ...uploadedPhotos];
        }

        const updatedData = {
            title,
            content,
            mood,
            date,
            photos,
        };

        if (tags) {
            updatedData.tags = JSON.parse(tags);
        }

        const entry = await JournalEntry.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updatedData,
            { new: true, runValidators: true }
        );

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Entry not found' });
        }

        res.json({ success: true, data: entry });
    } catch (error) {
        console.error('Update Entry Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a journal entry
// @route   DELETE /api/journal/:id
// @access  Private
exports.deleteEntry = async (req, res) => {
    try {
        const entry = await JournalEntry.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Entry not found' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
