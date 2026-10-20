const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Create employee profile
// @route   POST /api/employees
// @access  Private (HR)
const createEmployee = async (req, res) => {
  const {
    userId,
    department,
    designation,
    joiningDate,
    phone,
    address,
    managerId,
    emergencyContact,
  } = req.body;

  try {
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if employee profile already exists
    const existing = await Employee.findOne({ user: userId });
    if (existing) return res.status(400).json({ message: 'Employee profile already exists for this user' });

    const avatar = req.file ? `/uploads/${req.file.filename}` : '';

    const employee = await Employee.create({
      user: userId,
      department,
      designation,
      joiningDate,
      phone,
      address,
      managerId: managerId || null,
      avatar,
      emergencyContact,
    });

    const populated = await Employee.findById(employee._id)
      .populate('user', 'name email role isActive')
      .populate('managerId', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (HR, Manager)
const getAllEmployees = async (req, res) => {
  try {
    const { search, department } = req.query;
    let filter = {};
    if (department) filter.department = { $regex: department, $options: 'i' };

    let employees = await Employee.find(filter)
      .populate('user', 'name email role isActive department profilePicture')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });

    // Apply search across name/email from populated user
    if (search) {
      const s = search.toLowerCase();
      employees = employees.filter(
        (emp) =>
          emp.user?.name?.toLowerCase().includes(s) ||
          emp.user?.email?.toLowerCase().includes(s) ||
          emp.designation?.toLowerCase().includes(s)
      );
    }

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my employee profile
// @route   GET /api/employees/me
// @access  Private (Employee)
const getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'name email role department profilePicture isActive')
      .populate('managerId', 'name email department');

    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private (HR, Manager)
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'name email role isActive department profilePicture')
      .populate('managerId', 'name email');

    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee profile (HR)
// @route   PUT /api/employees/:id
// @access  Private (HR)
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const updates = { ...req.body };
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    // Also allow updating the linked User's basic info
    if (req.body.name || req.body.email || req.body.isActive !== undefined) {
      const userUpdates = {};
      if (req.body.name) userUpdates.name = req.body.name;
      if (req.body.email) userUpdates.email = req.body.email;
      if (req.body.isActive !== undefined) userUpdates.isActive = req.body.isActive;
      await User.findByIdAndUpdate(employee.user, userUpdates);
      delete updates.name;
      delete updates.email;
      delete updates.isActive;
    }

    const updated = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('user', 'name email role isActive department profilePicture')
      .populate('managerId', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update my own contact info (Employee)
// @route   PUT /api/employees/me
// @access  Private (Employee)
const updateMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    // Employees can only update personal/contact info, not department/designation
    const allowedUpdates = ['phone', 'address', 'emergencyContact'];
    const updates = {};
    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const updated = await Employee.findByIdAndUpdate(employee._id, updates, { new: true })
      .populate('user', 'name email role department profilePicture')
      .populate('managerId', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete employee (and optionally deactivate user)
// @route   DELETE /api/employees/:id
// @access  Private (HR)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Deactivate the linked user account
    await User.findByIdAndUpdate(employee.user, { isActive: false });
    await employee.deleteOne();

    res.json({ message: 'Employee removed and user deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getMyProfile,
  getEmployeeById,
  updateEmployee,
  updateMyProfile,
  deleteEmployee,
};
