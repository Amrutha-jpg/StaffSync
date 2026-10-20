# ⚡ StaffSync — Modern HR Management Solution

A full-stack, role-based Human Resource Management System built with **React**, **Node.js**, **Express**, and **MongoDB**.

![StaffSync](https://img.shields.io/badge/Stack-MERN-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)

---

## 🖼️ Features

### 👩‍💼 HR Role
- Employee directory with full **CRUD** (add, edit, deactivate)
- View and **approve/reject** all leave requests
- Company-wide **attendance** viewer with month/department filters
- **Announcement** composer with priority levels, audience targeting & pinning

### 🧑‍💼 Manager Role
- Team **leave approval queue**
- **Training program** management (create, edit, delete, enroll employees)
- Enrollment modal with multi-select employee picker
- Program status tracking (Scheduled → In-Progress → Completed)

### 👤 Employee Role
- **Attendance clock** — one-click Check In / Check Out with hours tracking
- **Leave application** with 6 leave types and cancel functionality
- Full **leave history** with approval status and comments
- **Profile viewer** with editable contact info
- Role-filtered **announcement bulletin**

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Vanilla CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB 8 + Mongoose |
| Auth | JWT Bearer tokens + bcrypt |
| File Upload | Multer |
| RBAC | Custom middleware (`protect` + `authorizeRoles`) |

---

## 📁 Project Structure

```
StaffSync/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Business logic (auth, employee, leave, attendance, announcement, training)
│   ├── middleware/     # auth, role, upload middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── utils/          # Notification dispatcher
│   ├── uploads/        # Multer file storage
│   ├── seeder.js       # Demo data seeder
│   └── server.js       # Express entry point
├── frontend/
│   ├── src/
│   │   ├── api/        # Axios client with JWT interceptor
│   │   ├── components/ # Navbar, ProtectedRoute
│   │   ├── context/    # AuthContext
│   │   └── pages/      # HRDashboard, ManagerDashboard, EmployeeDashboard, LoginPage
│   └── index.html
├── start-mongodb.bat   # Quick MongoDB launcher (Windows)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+ (or MongoDB Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/Amrutha-jpg/StaffSync.git
cd StaffSync
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env        # Fill in your MONGO_URI and JWT_SECRET
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
```

### 4. Start MongoDB (Windows — local)
```bash
# Run the helper batch file from the project root:
start-mongodb.bat
```
Or start your MongoDB service / Atlas connection.

### 5. Seed the database
```bash
cd backend
node seeder.js
```

### 6. Start the servers
```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| HR | `hr@staffsync.com` | `password123` |
| Manager | `manager@staffsync.com` | `password123` |
| Employee | `employee@staffsync.com` | `password123` |

---

## 📡 API Reference

| Base Route | Description |
|---|---|
| `POST /api/auth/login` | Login — returns JWT |
| `POST /api/auth/register` | Register new user (HR only in production) |
| `GET /api/employees` | List all employees (HR/Manager) |
| `POST /api/employees` | Create employee profile (HR) |
| `GET /api/employees/me` | Get own employee profile |
| `GET /api/leaves` | All leaves (HR/Manager) |
| `POST /api/leaves` | Submit leave request (Employee) |
| `PUT /api/leaves/:id/status` | Approve/Reject leave (Manager/HR) |
| `POST /api/attendance/checkin` | Clock in (Employee) |
| `PUT /api/attendance/checkout` | Clock out (Employee) |
| `GET /api/announcements` | Get role-filtered announcements |
| `POST /api/announcements` | Post announcement (HR/Manager) |
| `GET /api/training` | List training programs |
| `POST /api/training` | Create program (Manager/HR) |
| `PUT /api/training/:id/enroll` | Enroll employees (Manager/HR) |

---

## 🔐 Security Notes

- Never commit your `.env` file — use `.env.example` as a template
- JWT secrets should be long, random strings in production
- Change all demo passwords before any production deployment
- Set `NODE_ENV=production` and configure HTTPS + a reverse proxy (nginx)

---

## 📄 License

MIT © 2026 Amrutha
