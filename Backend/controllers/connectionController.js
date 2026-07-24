const Connection = require('../models/Connection');

// @desc    Create a new connection
// @route   POST /api/connections
// @access  Private
exports.createConnection = async (req, res) => {
    try {
        const connectionData = {
            ...req.body,
            userId: req.user._id,
        };

        const connection = await Connection.create(connectionData);
        res.status(201).json({ success: true, data: connection });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all connections for the user
// @route   GET /api/connections
// @access  Private
exports.getConnections = async (req, res) => {
    try {
        const connections = await Connection.find({ userId: req.user._id })
            .sort({ isFavorite: -1, name: 1 }); // Favorites first, then alphabetical

        res.json({ success: true, data: connections });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single connection by ID
// @route   GET /api/connections/:id
// @access  Private
exports.getConnection = async (req, res) => {
    try {
        const connection = await Connection.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!connection) {
            return res.status(404).json({ success: false, message: 'Connection not found' });
        }

        res.json({ success: true, data: connection });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a connection
// @route   PUT /api/connections/:id
// @access  Private
exports.updateConnection = async (req, res) => {
    try {
        const connection = await Connection.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!connection) {
            return res.status(404).json({ success: false, message: 'Connection not found' });
        }

        res.json({ success: true, data: connection });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a connection
// @route   DELETE /api/connections/:id
// @access  Private
exports.deleteConnection = async (req, res) => {
    try {
        const connection = await Connection.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!connection) {
            return res.status(404).json({ success: false, message: 'Connection not found' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
