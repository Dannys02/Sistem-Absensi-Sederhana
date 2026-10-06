const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true }, // format "2026-10-06"
    startTime: { type: String, required: true }, // format "07:00"
    lateThreshold: { type: String, required: true }, // format "07:15"
    endTime: { type: String, required: true }, // format "08:00"
  },
  { timestamps: true },
);

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);
