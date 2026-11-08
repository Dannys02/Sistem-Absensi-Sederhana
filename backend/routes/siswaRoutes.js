const express = require("express");
const router = express.Router();

// import fungsi controller
const {
  checkIn,
  getAttendanceByStudent,
  submitLeaveRequest,
} = require("../controllers/attendanceController");

const { getActiveLocations } = require("../controllers/locationController");

// middleware autentikasi
const {
  authenticate,
  authorize,
  validateBody,
} = require("../middleware/authenticate");

// Semua route di file ini khusus siswa
router.use(authenticate, authorize("siswa"));

// Attendance
router.post("/attendance/check-in", checkIn);
router.get("/attendance/me", getAttendanceByStudent);
router.post("/attendance/leave", validateBody, submitLeaveRequest);
router.get("/locations/active", getActiveLocations);

module.exports = router;
