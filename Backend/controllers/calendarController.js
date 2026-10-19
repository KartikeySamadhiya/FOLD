const JournalEntry = require('../models/JournalEntry');
const Connection = require('../models/Connection');
const Reminder = require('../models/Reminder');

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
            const bMonth = dob.getUTCMonth();
            const bDate = dob.getUTCDate();
            if (bMonth === parseInt(month) - 1) {
                birthdayEvents.push({
                    type: 'birthday',
                    title: `${conn.name}'s Birthday`,
                    date: new Date(year, month - 1, bDate),
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
            calendarMap[day] = { journal: [], reminders: [], birthdays: [], standaloneReminders: [] };
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

        // 4. Get standalone reminders
        // Fetch ALL user reminders (recurring ones could match any month)
        const allReminders = await Reminder.find({
            userId: req.user._id,
        }).select('title date time completed recurring');

        const m = parseInt(month) - 1; // 0-indexed month
        const y = parseInt(year);

        allReminders.forEach((rem) => {
            const remDate = new Date(rem.date);
            const remDay = remDate.getUTCDate();
            const remMonth = remDate.getUTCMonth();
            const remYear = remDate.getUTCFullYear();
            const remDayOfWeek = remDate.getUTCDay();
            const recur = rem.recurring || 'none';

            const pushReminder = (day) => {
                if (calendarMap[day]) {
                    calendarMap[day].standaloneReminders.push({
                        _id: rem._id,
                        type: 'standalone-reminder',
                        title: rem.title,
                        date: rem.date,
                        time: rem.time,
                        completed: rem.completed,
                        recurring: recur,
                    });
                }
            };

            if (recur === 'none') {
                // Exact match only
                if (remMonth === m && remYear === y) {
                    pushReminder(remDay);
                }
            } else if (recur === 'yearly') {
                // Same month & day, any year (on or after original)
                if (remMonth === m && y >= remYear) {
                    pushReminder(remDay);
                }
            } else if (recur === 'monthly') {
                // Same day every month (on or after original date)
                if (y > remYear || (y === remYear && m >= remMonth)) {
                    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
                    if (remDay <= lastDay) {
                        pushReminder(remDay);
                    }
                }
            } else if (recur === 'weekly') {
                // Same weekday every week (on or after original date)
                const viewStart = new Date(Date.UTC(y, m, 1));
                if (viewStart >= new Date(Date.UTC(remYear, remMonth, 1)) || (remYear === y && remMonth === m)) {
                    for (let d = 1; d <= daysInMonth; d++) {
                        const check = new Date(Date.UTC(y, m, d));
                        if (check.getUTCDay() === remDayOfWeek && check >= remDate) {
                            pushReminder(d);
                        }
                    }
                }
            } else if (recur === 'daily') {
                // Every single day (on or after original date)
                const originalDate = new Date(Date.UTC(remYear, remMonth, remDay));
                for (let d = 1; d <= daysInMonth; d++) {
                    const check = new Date(Date.UTC(y, m, d));
                    if (check >= originalDate) {
                        pushReminder(d);
                    }
                }
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
