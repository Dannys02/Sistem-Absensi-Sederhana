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
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    locationName: {
      type: String,
      default: null,
    },
    userCoordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    distanceMeters: {
      type: Number,
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

attendanceSchema.index(
  { studentId: 1, sessionId: 1 },
  { unique: true },
);

module.exports = mongoose.model("Attendance", attendanceSchema);
