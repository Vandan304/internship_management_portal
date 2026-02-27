const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
    // Log the full error and request details for debugging
    console.error("====== ERROR START ======");
    console.error(`Route: ${req.method} ${req.originalUrl}`);
    console.error("Request params:", req.params);
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    if (req.user) {
        console.error("User:", { id: req.user.id, role: req.user.role });
    }
    console.error("Error Message:", err.message);
    console.error("Stack Trace:", err.stack);
    console.error("====== ERROR END ======");

    // Determine status code
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    if (err.statusCode) {
        statusCode = err.statusCode;
    }

    // Handle Mongoose Bad Object ID
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        err.message = 'Resource not found / Invalid ID format';
    }

    // Handle Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map(val => val.message);
        err.message = messages.join(', ');
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

// Helper middleware to validate ObjectId format before doing DB operations
const validateObjectId = (req, res, next) => {
    if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    next();
};

module.exports = { errorHandler, validateObjectId };
