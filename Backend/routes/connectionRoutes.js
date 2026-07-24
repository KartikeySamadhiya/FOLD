const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createConnection,
    getConnections,
    getConnection,
    updateConnection,
    deleteConnection,
} = require('../controllers/connectionController');

// All routes are protected
router.use(protect);

router.route('/').post(createConnection).get(getConnections);
router.route('/:id').get(getConnection).put(updateConnection).delete(deleteConnection);

module.exports = router;
