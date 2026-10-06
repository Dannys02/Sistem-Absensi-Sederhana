const AttendanceSession = require("../models/AttendanceSession");
const { success, error } = require("../utils/responseHelper");

const createAttendanceSession = async (req, res) => {
  try {
    const { date, startTime, lateThreshold, endTime } = req.body;

    const session = await AttendanceSession.create({
      date,
      startTime,
      lateThreshold,
      endTime,
    });

    success(res, 200, "Berhasil membuat sesi absensi", session);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

module.exports = {
  createAttendanceSession,
};
