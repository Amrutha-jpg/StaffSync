const Announcement = require('../models/Announcement');
const { dispatchNotification, notificationTypes } = require('../utils/notificationDispatcher');

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (HR, Manager)
const createAnnouncement = async (req, res) => {
  const { title, content, targetRole, priority, isPinned } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const announcement = await Announcement.create({
      title,
      content,
      targetRole: targetRole || 'all',
      priority: priority || 'Medium',
      isPinned: isPinned || false,
      postedBy: req.user._id,
    });

    await dispatchNotification(notificationTypes.ANNOUNCEMENT_POSTED, req.user._id, {
      announcementId: announcement._id,
      title,
      targetRole,
    });

    const populated = await Announcement.findById(announcement._id).populate('postedBy', 'name role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all announcements (filtered by role)
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const filter =
      req.user.role === 'hr'
        ? {}
        : { $or: [{ targetRole: req.user.role }, { targetRole: 'all' }] };

    const announcements = await Announcement.find(filter)
      .populate('postedBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (HR, Manager)
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    // Managers can only edit their own announcements
    if (
      req.user.role === 'manager' &&
      announcement.postedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to edit this announcement' });
    }

    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('postedBy', 'name role');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (HR)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement };
