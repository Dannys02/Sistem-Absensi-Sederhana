const express = require("express");
const router = express.Router();

// import fungsi controller
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
  getTodayAttendanceSession
} = require("../controllers/attendanceSessionController");

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

// Semua route di file ini khusus admin
router.use(authenticate, authorize("admin"));

// CRUD Student
router.get("/all-student", getAllStudentAccount);
router.post(
  "/create-student",
  validateBody,
  validateCreateStudent,
  createStudentAccount,
);
router.put(
  "/update-student/:id",
  validateBody,
  validateUpdateStudent,
  updateStudentAccount,
);
router.delete("/delete-student/:id", deleteStudentAccount);

// CRUD Class
router.get("/all-class", getAllClass);
router.get("/show-class/:id", classById);
router.post("/create-class", validateBody, validateCreateClass, createClass);
router.put("/update-class/:id", validateBody, validateUpdateClass, updateClass);
router.delete("/delete-class/:id", deleteClass);

// Attendance Session
router.get("/attendance-sessions/today", authenticate, getTodayAttendanceSession);
router.post("/attendance-sessions", createAttendanceSession);

module.exports = router;
