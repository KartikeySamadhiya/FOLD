const JournalEntry = require('../models/JournalEntry');
const Connection = require('../models/Connection');

// @desc    Get unified calendar data for a given month
// @route   GET /api/calendar?month=7&year=2026
// @access  Private
exports.getCalendarData = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year query parameters are required',
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // 1. Get journal entries for the month
        const journalEntries = await JournalEntry.find({
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate },
        }).select('title date mood photos');

        // 2. Get connection reminders that fall within this month
        const connections = await Connection.find({
            userId: req.user._id,
            'reminders.date': { $gte: startDate, $lte: endDate },
        }).select('name photo reminders');

        // Flatten reminders into calendar events
        const reminderEvents = [];
        connections.forEach((conn) => {
            conn.reminders.forEach((reminder) => {
                const reminderDate = new Date(reminder.date);
                if (reminderDate >= startDate && reminderDate <= endDate) {
                    reminderEvents.push({
                        type: 'reminder',
                        title: reminder.title,
                        date: reminder.date,
                        connectionName: conn.name,
                        connectionPhoto: conn.photo,
                        connectionId: conn._id,
                    });
                }
            });
        });

        // 3. Check for birthdays in this month (any year)
        const allConnections = await Connection.find({
            userId: req.user._id,
            dateOfBirth: { $exists: true, $ne: null },
        }).select('name photo dateOfBirth');

        const birthdayEvents = [];
        allConnections.forEach((conn) => {
            const dob = new Date(conn.dateOfBirth);
            if (dob.getMonth() === parseInt(month) - 1) {
                birthdayEvents.push({
                    type: 'birthday',
                    title: `${conn.name}'s Birthday`,
                    date: new Date(year, month - 1, dob.getDate()),
                    connectionName: conn.name,
                    connectionPhoto: conn.photo,
                    connectionId: conn._id,
                });
            }
        });

        // Build a map of day → events for easy calendar rendering
        const calendarMap = {};
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            calendarMap[day] = { journal: [], reminders: [], birthdays: [] };
        }

        journalEntries.forEach((entry) => {
            const day = new Date(entry.date).getDate();
            if (calendarMap[day]) {
                calendarMap[day].journal.push(entry);
            }
        });

        reminderEvents.forEach((event) => {
            const day = new Date(event.date).getDate();
            if (calendarMap[day]) {
                calendarMap[day].reminders.push(event);
            }
        });

        birthdayEvents.forEach((event) => {
            const day = new Date(event.date).getDate();
            if (calendarMap[day]) {
                calendarMap[day].birthdays.push(event);
            }
        });

        res.json({
            success: true,
            data: {
                month: parseInt(month),
                year: parseInt(year),
                calendarMap,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
