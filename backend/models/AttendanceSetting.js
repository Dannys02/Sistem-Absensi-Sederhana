const mongoose = require("mongoose");

const attendanceSettingSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      default: "06:00",
    },
    lateThreshold: {
      type: String,
      required: true,
      default: "06:30",
    },
    endTime: {
      type: String,
      required: true,
      default: "07:00",
    },
    // 0 = Minggu, 1 = Senin, ..., 5 = Jumat, 6 = Sabtu
    activeDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5],
    },
    isAutomated: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendanceSetting", attendanceSettingSchema);
