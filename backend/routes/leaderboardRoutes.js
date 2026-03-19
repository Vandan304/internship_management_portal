const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/leaderboard
// @desc    Get ranked interns
// @access  Private
router.get('/', protect, getLeaderboard);

module.exports = router;
