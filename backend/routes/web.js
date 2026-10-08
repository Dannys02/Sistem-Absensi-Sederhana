const express = require("express");
const router = express.Router();

// import fungsi controller
const { register, login } = require("../controllers/authController");

const {
  createClass,
  getAllClass,
  updateClass,
  deleteClass,
  classById,
} = require("../controllers/classController");

const {
  createStudentAccount,
  getAllStudentAccount,
  updateStudentAccount,
  deleteStudentAccount,
} = require("../controllers/studentController");

const {
  createAttendanceSession,
  getTodayAttendanceSession,
} = require("../controllers/attendanceSessionController");

const {
  checkIn,
  getAttendanceByStudent,
  submitLeaveRequest,
} = require("../controllers/attendanceController");

// validasi request body
const {
  validateCreateClass,
  validateUpdateClass,
} = require("../request/validateClass");
const {
  validateCreateStudent,
  validateUpdateStudent,
} = require("../request/validateUserStudent");

// middleware autentikasi
const {
  authenticate,
  authorize,
  validateBody,
} = require("../middleware/authenticate");

// Auth
router.post("/register", validateCreateStudent, register);
router.post("/login", login);

// CRUD Student
router.get(
  "/all-student",
  authenticate,
  authorize("admin"),
  getAllStudentAccount,
);
router.post(
  "/create-student",
  authenticate,
  authorize("admin"),
  validateBody,
  validateCreateStudent,
  createStudentAccount,
);
router.put(
  "/update-student/:id",
  authenticate,
  authorize("admin"),
  validateBody,
  validateUpdateStudent,
  updateStudentAccount,
);
router.delete(
  "/delete-student/:id",
  authenticate,
  authorize("admin"),
  deleteStudentAccount,
);

// CRUD Class
router.get("/all-class", authenticate, authorize("admin"), getAllClass);
router.get("/show-class/:id", authenticate, authorize("admin"), classById);
router.post(
  "/create-class",
  authenticate,
  authorize("admin"),
  validateBody,
  validateCreateClass,
  createClass,
);
router.put(
  "/update-class/:id",
  authenticate,
  authorize("admin"),
  validateBody,
  validateUpdateClass,
  updateClass,
);
router.delete(
  "/delete-class/:id",
  authenticate,
  authorize("admin"),
  deleteClass,
);

// CRUD Attendance Session
router.post(
  "/attendance-sessions",
  authenticate,
  authorize("admin"),
  createAttendanceSession,
);
router.get(
  "/attendance-sessions/today",
  authenticate,
  getTodayAttendanceSession,
);
router.post("/attendance/check-in", authenticate, authorize("siswa"), checkIn);
router.get("/attendance/me", authenticate, authorize("siswa"), getAttendanceByStudent);
router.post("/attendance/leave", authenticate, authorize("siswa"), validateBody, submitLeaveRequest);

// Error handler async
router.use((err, req, res, next) => {
  if (err.code === 11000) {
    // Handle E11000 - duplicate key error dari MongoDB
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} sudah terdaftar`,
      data: null,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "ID tidak valid" });
  }
  res.status(500).json({ error: "Server error" });
});

module.exports = router;
