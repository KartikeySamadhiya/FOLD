const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createEntry,
    getEntries,
    getEntriesByDate,
    updateEntry,
    deleteEntry,
} = require('../controllers/journalController');

// All routes are protected
router.use(protect);

router.route('/').post(createEntry).get(getEntries);
router.route('/date/:date').get(getEntriesByDate);
router.route('/:id').put(updateEntry).delete(deleteEntry);

module.exports = router;
