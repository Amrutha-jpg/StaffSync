const express = require('express');
const router = express.Router();
const {
  createProgram,
  getAllPrograms,
  getMyPrograms,
  getProgramById,
  updateProgram,
  enrollEmployees,
  deleteProgram,
} = require('../controllers/trainingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Employee: view enrolled programs
router.get('/my', protect, authorizeRoles('employee'), getMyPrograms);

// Manager / HR: manage programs
router.get('/', protect, authorizeRoles('hr', 'manager'), getAllPrograms);
router.post('/', protect, authorizeRoles('hr', 'manager'), createProgram);
router.get('/:id', protect, authorizeRoles('hr', 'manager'), getProgramById);
router.put('/:id', protect, authorizeRoles('hr', 'manager'), updateProgram);
router.put('/:id/enroll', protect, authorizeRoles('hr', 'manager'), enrollEmployees);
router.delete('/:id', protect, authorizeRoles('hr', 'manager'), deleteProgram);

module.exports = router;
