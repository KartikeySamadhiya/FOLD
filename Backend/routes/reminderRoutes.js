const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createReminder,
    getByDate,
    updateReminder,
    deleteReminder,
    toggleComplete,
} = require('../controllers/reminderController');

router.use(protect); // All routes require authentication

router.post('/', createReminder);
router.get('/date/:date', getByDate);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);
router.patch('/:id/toggle', toggleComplete);

module.exports = router;
