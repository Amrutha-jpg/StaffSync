const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  getMyProfile,
  getEmployeeById,
  updateEmployee,
  updateMyProfile,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Self-service routes (Employee)
router.get('/me', protect, getMyProfile);
router.put('/me', protect, authorizeRoles('employee'), upload.single('avatar'), updateMyProfile);

// HR / Manager management routes
router.get('/', protect, authorizeRoles('hr', 'manager'), getAllEmployees);
router.post('/', protect, authorizeRoles('hr'), upload.single('avatar'), createEmployee);
router.get('/:id', protect, authorizeRoles('hr', 'manager'), getEmployeeById);
router.put('/:id', protect, authorizeRoles('hr'), upload.single('avatar'), updateEmployee);
router.delete('/:id', protect, authorizeRoles('hr'), deleteEmployee);

module.exports = router;
