const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCalendarData } = require('../controllers/calendarController');

router.use(protect);

router.get('/', getCalendarData);

module.exports = router;
