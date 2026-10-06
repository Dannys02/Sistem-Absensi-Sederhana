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

const getTodayAttendanceSession = async (req, res) => {
  try {
    const now = new Date();

    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const endOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );

    const session = await AttendanceSession.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    if (!session) {
      return error(res, 404, "Sesi absensi hari ini tidak ditemukan");
    }

    success(res, 200, "Berhasil mengambil sesi absensi hari ini", session);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

module.exports = {
  createAttendanceSession,
  getTodayAttendanceSession,
};
