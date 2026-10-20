const mongoose = require('mongoose');

const trainingProgramSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['Scheduled', 'In-Progress', 'Completed'],
      default: 'Scheduled',
    },
    scheduleDate: {
      type: Date,
      required: [true, 'Schedule date is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    maxParticipants: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainingProgram', trainingProgramSchema);
