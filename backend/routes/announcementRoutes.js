const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorizeRoles('hr', 'manager'), createAnnouncement);
router.put('/:id', protect, authorizeRoles('hr', 'manager'), updateAnnouncement);
router.delete('/:id', protect, authorizeRoles('hr'), deleteAnnouncement);

module.exports = router;
