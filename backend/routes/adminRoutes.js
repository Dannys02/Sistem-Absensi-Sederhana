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

const {
  getAttendanceSetting,
  updateAttendanceSetting,
} = require("../controllers/attendanceSettingController");

const { getSubmitLeaveRequestByAdmin, approvedAttendanceLeaveByAdmin, rejectAttendanceLeaveByAdmin, markAbsentStudents, getStudentsWithoutAttendanceToday, getAttendanceRecapByAdmin, downloadAttendanceRecapPdf } = require("../controllers/attendanceController");

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
router.get("/attendance-sessions/today", getTodayAttendanceSession);
router.post("/attendance-sessions", createAttendanceSession);

// Attendance Settings (Pengaturan Otomasi Sesi)
router.get("/attendance-settings", getAttendanceSetting);
router.put("/attendance-settings", updateAttendanceSetting);

// Attendance Student yang izin/sakit
router.get("/attendance/leave", getSubmitLeaveRequestByAdmin);
router.put("/attendance/leave/approve/:id", approvedAttendanceLeaveByAdmin);
router.put("/attendance/leave/reject/:id", rejectAttendanceLeaveByAdmin);

router.post("/attendance-sessions/:sessionId/mark-absent", markAbsentStudents);
router.get("/student-without-attendance", getStudentsWithoutAttendanceToday)
router.get("/attendance/recap", getAttendanceRecapByAdmin);
router.get("/attendance/recap/pdf", downloadAttendanceRecapPdf);

module.exports = router;
