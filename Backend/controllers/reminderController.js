const Reminder = require('../models/Reminder');

// @desc    Create a new reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = async (req, res) => {
    try {
        const { title, date, time, notes, recurring } = req.body;

        const reminder = await Reminder.create({
            userId: req.user._id,
            title,
            date,
            time: time || '',
            notes: notes || '',
            recurring: recurring || 'none',
        });

        res.status(201).json({ success: true, data: reminder });
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get reminders for a specific date
// @route   GET /api/reminders/date/:date
// @access  Private
exports.getByDate = async (req, res) => {
    try {
        const dateStr = req.params.date; // "YYYY-MM-DD"
        const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
        const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

        const reminders = await Reminder.find({
            userId: req.user._id,
            date: { $gte: startOfDay, $lte: endOfDay },
        }).sort({ time: 1, createdAt: 1 });

        res.json({ success: true, data: reminders });
    } catch (error) {
        console.error('Get reminders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }

        res.json({ success: true, data: reminder });
    } catch (error) {
        console.error('Update reminder error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error('Delete reminder error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle reminder completion
// @route   PATCH /api/reminders/:id/toggle
// @access  Private
exports.toggleComplete = async (req, res) => {
    try {
        const reminder = await Reminder.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }

        reminder.completed = !reminder.completed;
        await reminder.save();

        res.json({ success: true, data: reminder });
    } catch (error) {
        console.error('Toggle reminder error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
