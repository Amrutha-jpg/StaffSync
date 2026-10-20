const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  getTeamLeaves,
  getMyLeaves,
  updateLeaveStatus,
  deleteLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Employee endpoints
router.get('/my', protect, authorizeRoles('employee'), getMyLeaves);
router.post('/', protect, authorizeRoles('employee'), applyLeave);
router.delete('/:id', protect, deleteLeave);

// Manager / HR endpoints
router.get('/team', protect, authorizeRoles('hr', 'manager'), getTeamLeaves);
router.get('/', protect, authorizeRoles('hr', 'manager'), getLeaves);
router.put('/:id/status', protect, authorizeRoles('hr', 'manager'), updateLeaveStatus);

module.exports = router;
