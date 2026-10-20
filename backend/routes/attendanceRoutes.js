const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendance,
  getAllAttendance,
  getMyAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Employee endpoints
router.get('/my', protect, authorizeRoles('employee'), getMyAttendance);
router.post('/checkin', protect, authorizeRoles('employee'), checkIn);
router.put('/checkout', protect, authorizeRoles('employee'), checkOut);

// HR: company-wide consolidated view
router.get('/all', protect, authorizeRoles('hr'), getAllAttendance);

// General (HR + Manager see all, Employee sees own via query)
router.get('/', protect, getAttendance);

module.exports = router;
