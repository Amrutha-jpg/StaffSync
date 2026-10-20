const Attendance = require('../models/Attendance');

// Helper to get YYYY-MM-DD string for today
const todayString = () => new Date().toISOString().split('T')[0];

// @desc    Clock in
// @route   POST /api/attendance/checkin
// @access  Private (Employee)
const checkIn = async (req, res) => {
  try {
    const date = todayString();

    const existing = await Attendance.findOne({ employee: req.user._id, date });
    if (existing) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date,
      checkIn: new Date(),
      status: 'Present',
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clock out
// @route   PUT /api/attendance/checkout
// @access  Private (Employee)
const checkOut = async (req, res) => {
  try {
    const date = todayString();

    const attendance = await Attendance.findOne({ employee: req.user._id, date });
    if (!attendance) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    const diffMs = attendance.checkOut - attendance.checkIn;
    const diffHours = diffMs / (1000 * 60 * 60);
    attendance.hoursWorked = parseFloat(diffHours.toFixed(2));

    // Mark as half-day if less than 4 hours
    if (diffHours < 4) attendance.status = 'Half-day';

    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all attendance (HR/Manager) or own (Employee)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'employee') {
      filter.employee = req.user._id;
    }

    const { month, year, department } = req.query;
    if (month && year) {
      filter.date = {
        $gte: `${year}-${String(month).padStart(2, '0')}-01`,
        $lte: `${year}-${String(month).padStart(2, '0')}-31`,
      };
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'name email department')
      .sort({ date: -1, createdAt: -1 });

    // Department filter post-populate
    const result =
      department
        ? records.filter((r) => r.employee?.department?.toLowerCase() === department.toLowerCase())
        : records;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all company-wide attendance
// @route   GET /api/attendance/all
// @access  Private (HR)
const getAllAttendance = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let filter = {};
    if (date) filter.date = date;
    else if (month && year) {
      filter.date = {
        $gte: `${year}-${String(month).padStart(2, '0')}-01`,
        $lte: `${year}-${String(month).padStart(2, '0')}-31`,
      };
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'name email department')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my monthly attendance log
// @route   GET /api/attendance/my
// @access  Private (Employee)
const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = { employee: req.user._id };

    if (month && year) {
      filter.date = {
        $gte: `${year}-${String(month).padStart(2, '0')}-01`,
        $lte: `${year}-${String(month).padStart(2, '0')}-31`,
      };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkIn, checkOut, getAttendance, getAllAttendance, getMyAttendance };
