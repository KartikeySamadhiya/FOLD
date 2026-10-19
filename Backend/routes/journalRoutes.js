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

const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 50 * 1024 * 1024, // 50MB for text fields (handles legacy base64 photos)
        fileSize: 10 * 1024 * 1024,  // 10MB per file
    },
});

// All routes are protected
router.use(protect);

// Allow up to 5 photos per journal entry
router.route('/').post(upload.array('photos', 5), createEntry).get(getEntries);
router.route('/date/:date').get(getEntriesByDate);
router.route('/:id').put(upload.array('photos', 5), updateEntry).delete(deleteEntry);

module.exports = router;
