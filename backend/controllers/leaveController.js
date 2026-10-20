const Leave = require('../models/Leave');
const { dispatchNotification, notificationTypes } = require('../utils/notificationDispatcher');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (Employee)
const applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ message: 'leaveType, startDate, endDate, and reason are required' });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ message: 'Start date cannot be after end date' });
  }

  try {
    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await dispatchNotification(notificationTypes.LEAVE_SUBMITTED, req.user._id, {
      leaveId: leave._id,
      leaveType,
      startDate,
      endDate,
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all leaves (HR: all, Manager: all, Employee: own)
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'employee') {
      filter.employee = req.user._id;
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'name email department')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team leave requests (Manager sees all; could be scoped by managerId in future)
// @route   GET /api/leaves/team
// @access  Private (Manager, HR)
const getTeamLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'Pending' })
      .populate('employee', 'name email department')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my leave requests
// @route   GET /api/leaves/my
// @access  Private (Employee)
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update leave status (approve/reject)
// @route   PUT /api/leaves/:id/status
// @access  Private (Manager, HR)
const updateLeaveStatus = async (req, res) => {
  const { status, comments } = req.body;

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be "Approved" or "Rejected"' });
  }

  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending leave requests can be reviewed' });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    if (comments) leave.comments = comments;
    await leave.save();

    // Notify employee of decision
    const notifType =
      status === 'Approved' ? notificationTypes.LEAVE_APPROVED : notificationTypes.LEAVE_REJECTED;

    await dispatchNotification(notifType, leave.employee, {
      leaveId: leave._id,
      status,
      comments,
      reviewedBy: req.user.name,
    });

    const populated = await Leave.findById(leave._id)
      .populate('employee', 'name email department')
      .populate('reviewedBy', 'name role');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a leave request
// @route   DELETE /api/leaves/:id
// @access  Private (Employee – own pending only, HR – any)
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (req.user.role === 'employee') {
      if (leave.employee.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this leave request' });
      }
      if (leave.status !== 'Pending') {
        return res.status(400).json({ message: 'Cannot delete a reviewed leave request' });
      }
    }

    await leave.deleteOne();
    res.json({ message: 'Leave request deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLeave, getLeaves, getTeamLeaves, getMyLeaves, updateLeaveStatus, deleteLeave };
