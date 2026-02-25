const express = require('express');
const router = express.Router();
const {
    getInterns,
    createIntern,
    updateIntern,
    deleteIntern,
    blockIntern,
    activateIntern
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All routes here should be protected and only accessible by admins
router.use(protect);
router.use(authorizeRoles('admin'));

// Route: /api/admin/interns
router.get('/interns', getInterns);

// Route: /api/admin/intern
router.post('/intern', createIntern);

// Route: /api/admin/intern/:id
router.put('/intern/:id', updateIntern);
router.delete('/intern/:id', deleteIntern);

// Route: /api/admin/intern/:id/block and /activate
router.patch('/intern/:id/block', blockIntern);
router.patch('/intern/:id/activate', activateIntern);

module.exports = router;
