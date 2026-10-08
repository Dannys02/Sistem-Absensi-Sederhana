const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },

    checkInTime: {
      type: Date,
      default: null,
    },
    requestType: {
      type: String,
      enum: ["Izin", "Sakit"],
      default: null,
    },
    status: {
      type: String,
      enum: ["Hadir", "Telat", "Izin", "Sakit", "Alpha", "Menunggu Approval"],
      required: true,
    },

    reason: {
      type: String,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Attendance", attendanceSchema);
