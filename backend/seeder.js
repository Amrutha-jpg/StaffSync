const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Employee = require('./models/Employee');
const Announcement = require('./models/Announcement');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');
const TrainingProgram = require('./models/TrainingProgram');

const MONGO_URI = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/staffsync')
  .replace('localhost', '127.0.0.1');

const todayStr = () => new Date().toISOString().split('T')[0];
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB Connected for seeding ✅');

    // Clear existing data
    await User.deleteMany();
    await Employee.deleteMany();
    await Announcement.deleteMany();
    await Leave.deleteMany();
    await Attendance.deleteMany();
    await TrainingProgram.deleteMany();

    console.log('🗑️  Cleared existing data...');

    // ── Create Users ──────────────────────────────────────────────
    const users = await User.insertMany([
      {
        name: 'Alice Johnson',
        email: 'hr@staffsync.com',
        password: await bcrypt.hash('password123', 10),
        role: 'hr',
        department: 'Human Resources',
      },
      {
        name: 'Bob Smith',
        email: 'manager@staffsync.com',
        password: await bcrypt.hash('password123', 10),
        role: 'manager',
        department: 'Engineering',
      },
      {
        name: 'Carol White',
        email: 'employee@staffsync.com',
        password: await bcrypt.hash('password123', 10),
        role: 'employee',
        department: 'Engineering',
      },
      {
        name: 'David Lee',
        email: 'employee2@staffsync.com',
        password: await bcrypt.hash('password123', 10),
        role: 'employee',
        department: 'Marketing',
      },
    ]);

    console.log('👥 Created users:', users.map((u) => u.email).join(', '));

    const hrUser     = users.find((u) => u.role === 'hr');
    const managerUser = users.find((u) => u.role === 'manager');
    const empUser    = users.find((u) => u.email === 'employee@staffsync.com');
    const emp2User   = users.find((u) => u.email === 'employee2@staffsync.com');

    // ── Create Employee Profiles ──────────────────────────────────
    await Employee.insertMany([
      {
        user: hrUser._id,
        department: 'Human Resources',
        designation: 'HR Manager',
        phone: '+1 555 001 0001',
        address: '10 HR Lane, New York, NY',
        joiningDate: new Date('2022-01-15'),
      },
      {
        user: managerUser._id,
        department: 'Engineering',
        designation: 'Engineering Manager',
        phone: '+1 555 002 0002',
        address: '20 Tech Ave, San Francisco, CA',
        joiningDate: new Date('2021-06-01'),
      },
      {
        user: empUser._id,
        department: 'Engineering',
        designation: 'Senior Developer',
        phone: '+1 555 003 0003',
        address: '30 Code St, Austin, TX',
        managerId: managerUser._id,
        joiningDate: new Date('2023-03-10'),
      },
      {
        user: emp2User._id,
        department: 'Marketing',
        designation: 'Marketing Analyst',
        phone: '+1 555 004 0004',
        address: '40 Market Blvd, Chicago, IL',
        managerId: managerUser._id,
        joiningDate: new Date('2023-07-20'),
      },
    ]);

    console.log('🏢 Created employee profiles');

    // ── Create Announcements ──────────────────────────────────────
    await Announcement.insertMany([
      {
        title: 'Welcome to StaffSync!',
        content: 'We are excited to launch our new HR management platform. Explore all the features available to you.',
        targetRole: 'all',
        postedBy: hrUser._id,
        priority: 'High',
        isPinned: true,
      },
      {
        title: 'Q4 Performance Reviews',
        content: 'Performance reviews for Q4 will begin next month. Please ensure all self-assessments are completed by the 15th.',
        targetRole: 'employee',
        postedBy: hrUser._id,
        priority: 'Medium',
      },
      {
        title: 'Manager Leadership Training',
        content: 'A mandatory leadership training session is scheduled for all managers on November 5th.',
        targetRole: 'manager',
        postedBy: hrUser._id,
        priority: 'Urgent',
      },
    ]);

    console.log('📢 Created announcements');

    // ── Create Leave Requests ─────────────────────────────────────
    await Leave.insertMany([
      {
        employee: empUser._id,
        leaveType: 'Sick',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-03'),
        reason: 'Flu and fever',
        status: 'Pending',
      },
      {
        employee: emp2User._id,
        leaveType: 'Casual',
        startDate: new Date('2026-10-25'),
        endDate: new Date('2026-10-26'),
        reason: 'Family event',
        status: 'Approved',
        reviewedBy: managerUser._id,
        comments: 'Approved, enjoy your time!',
      },
      {
        employee: empUser._id,
        leaveType: 'Paid',
        startDate: new Date('2026-09-10'),
        endDate: new Date('2026-09-14'),
        reason: 'Annual vacation',
        status: 'Approved',
        reviewedBy: hrUser._id,
      },
    ]);

    console.log('📋 Created leave requests');

    // ── Create Attendance ─────────────────────────────────────────
    await Attendance.insertMany([
      {
        employee: empUser._id,
        date: todayStr(),
        checkIn: new Date(),
        status: 'Present',
      },
      {
        employee: empUser._id,
        date: yesterdayStr(),
        checkIn: new Date(Date.now() - 9 * 3600000 - 86400000),
        checkOut: new Date(Date.now() - 1 * 3600000 - 86400000),
        hoursWorked: 8,
        status: 'Present',
      },
    ]);

    console.log('📅 Created attendance records');

    // ── Create Training Programs ──────────────────────────────────
    await TrainingProgram.insertMany([
      {
        title: 'JavaScript Advanced Patterns',
        description: 'Deep dive into closures, prototypes, and async patterns in JS.',
        managerId: managerUser._id,
        enrolledEmployees: [empUser._id],
        scheduleDate: new Date('2026-11-15'),
        location: 'Room 202',
        status: 'Scheduled',
      },
      {
        title: 'Effective Communication',
        description: 'Workshop on cross-functional team communication.',
        managerId: managerUser._id,
        enrolledEmployees: [empUser._id, emp2User._id],
        scheduleDate: new Date('2026-10-28'),
        location: 'Online / Zoom',
        status: 'In-Progress',
      },
    ]);

    console.log('🎓 Created training programs');

    console.log('\n✅ Seeding complete!');
    console.log('\n📋 Login credentials:');
    console.log('  HR:        hr@staffsync.com        / password123');
    console.log('  Manager:   manager@staffsync.com   / password123');
    console.log('  Employee:  employee@staffsync.com  / password123');
    console.log('  Employee2: employee2@staffsync.com / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedData();
