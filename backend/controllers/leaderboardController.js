const User = require('../models/User');

// @desc    Get leaderboard data (ranked interns)
// @route   GET /api/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res, next) => {
    try {
        const interns = await User.find({ role: 'intern' })
            .select('name internId points internRole')
            .sort({ points: -1 });
        const rankedInterns = interns.map((intern, index) => ({
            id: intern._id,
            name: intern.name,
            internId: intern.internId,
            points: intern.points || 0,
            internRole: intern.internRole,
            rank: index + 1
        }));
        const top3 = rankedInterns.slice(0, 3);
        res.status(200).json({
            success: true,
            totalInterns: rankedInterns.length,
            top3,
            fullList: rankedInterns
        });
    } catch (error) {
        next(error);
    }
};
