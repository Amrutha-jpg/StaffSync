const TrainingProgram = require('../models/TrainingProgram');
const User = require('../models/User');
const { dispatchNotification, notificationTypes } = require('../utils/notificationDispatcher');

// @desc    Create a training program
// @route   POST /api/training
// @access  Private (Manager, HR)
const createProgram = async (req, res) => {
  const { title, description, scheduleDate, location, maxParticipants, enrolledEmployees } = req.body;

  try {
    if (!title || !scheduleDate) {
      return res.status(400).json({ message: 'Title and schedule date are required' });
    }

    const program = await TrainingProgram.create({
      title,
      description,
      managerId: req.user._id,
      scheduleDate,
      location,
      maxParticipants,
      enrolledEmployees: enrolledEmployees || [],
    });

    // Notify enrolled employees
    if (enrolledEmployees?.length) {
      for (const empId of enrolledEmployees) {
        await dispatchNotification(notificationTypes.TRAINING_ENROLLED, empId, {
          programId: program._id,
          title,
          scheduleDate,
        });
      }
    }

    const populated = await TrainingProgram.findById(program._id)
      .populate('managerId', 'name email')
      .populate('enrolledEmployees', 'name email department');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all training programs (filtered by manager for managers)
// @route   GET /api/training
// @access  Private (Manager, HR)
const getAllPrograms = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'manager') {
      filter.managerId = req.user._id;
    }

    const programs = await TrainingProgram.find(filter)
      .populate('managerId', 'name email')
      .populate('enrolledEmployees', 'name email department')
      .sort({ scheduleDate: 1 });

    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get training programs for logged-in employee
// @route   GET /api/training/my
// @access  Private (Employee)
const getMyPrograms = async (req, res) => {
  try {
    const programs = await TrainingProgram.find({
      enrolledEmployees: req.user._id,
    })
      .populate('managerId', 'name email')
      .sort({ scheduleDate: 1 });

    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single training program
// @route   GET /api/training/:id
// @access  Private (Manager, HR)
const getProgramById = async (req, res) => {
  try {
    const program = await TrainingProgram.findById(req.params.id)
      .populate('managerId', 'name email')
      .populate('enrolledEmployees', 'name email department');

    if (!program) return res.status(404).json({ message: 'Training program not found' });

    res.json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update training program (title, description, status, schedule, enrollment)
// @route   PUT /api/training/:id
// @access  Private (Manager – own, HR – any)
const updateProgram = async (req, res) => {
  try {
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Training program not found' });

    // Managers can only edit their own programs
    if (req.user.role === 'manager' && program.managerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this program' });
    }

    const updatedProgram = await TrainingProgram.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('managerId', 'name email')
      .populate('enrolledEmployees', 'name email department');

    // Notify enrolled employees of update
    if (updatedProgram.enrolledEmployees?.length) {
      for (const emp of updatedProgram.enrolledEmployees) {
        await dispatchNotification(notificationTypes.TRAINING_UPDATED, emp._id, {
          programId: updatedProgram._id,
          title: updatedProgram.title,
          status: updatedProgram.status,
        });
      }
    }

    res.json(updatedProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enroll employees into a program
// @route   PUT /api/training/:id/enroll
// @access  Private (Manager, HR)
const enrollEmployees = async (req, res) => {
  const { employeeIds } = req.body;

  try {
    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({ message: 'employeeIds must be an array' });
    }

    const program = await TrainingProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Training program not found' });

    if (req.user.role === 'manager' && program.managerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add without duplicates
    const newIds = employeeIds.filter(
      (id) => !program.enrolledEmployees.map((e) => e.toString()).includes(id)
    );
    program.enrolledEmployees.push(...newIds);
    await program.save();

    for (const empId of newIds) {
      await dispatchNotification(notificationTypes.TRAINING_ENROLLED, empId, {
        programId: program._id,
        title: program.title,
        scheduleDate: program.scheduleDate,
      });
    }

    const populated = await TrainingProgram.findById(program._id)
      .populate('managerId', 'name email')
      .populate('enrolledEmployees', 'name email department');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a training program
// @route   DELETE /api/training/:id
// @access  Private (Manager – own, HR – any)
const deleteProgram = async (req, res) => {
  try {
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Training program not found' });

    if (req.user.role === 'manager' && program.managerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await program.deleteOne();
    res.json({ message: 'Training program deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProgram,
  getAllPrograms,
  getMyPrograms,
  getProgramById,
  updateProgram,
  enrollEmployees,
  deleteProgram,
};
