const JournalEntry = require('../models/JournalEntry');

// @desc    Create a new journal entry
// @route   POST /api/journal
// @access  Private
exports.createEntry = async (req, res) => {
    try {
        const { title, content, photos, mood, date, tags } = req.body;

        const entry = await JournalEntry.create({
            userId: req.user._id,
            title,
            content,
            photos: photos || [],
            mood: mood || 'neutral',
            date,
            tags: tags || [],
        });

        res.status(201).json({ success: true, data: entry });
    } catch (error) {
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
        const entry = await JournalEntry.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Entry not found' });
        }

        res.json({ success: true, data: entry });
    } catch (error) {
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
