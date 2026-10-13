const AttendanceSession = require("../models/AttendanceSession");
const { getJakartaDateString, getJakartaDayRange } = require("../utils/jakartaDate");
const { success, error } = require("../utils/responseHelper");

const createAttendanceSession = async (req, res) => {
  try {
    const { date, startTime, lateThreshold, endTime } = req.body;

    // validasi format tanggal
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return error(res, 400, "Format date harus YYYY-MM-DD");
    }

    // validasi format dan urutan jam
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (
      !timeRegex.test(startTime || "") ||
      !timeRegex.test(lateThreshold || "") ||
      !timeRegex.test(endTime || "")
    ) {
      return error(
        res,
        400,
        "Format waktu harus HH:mm, misalnya 15:00"
      );
    }

    // validasi tanggal kalender
    const { startOfDay, endOfDay } = getJakartaDayRange(date);
    if (getJakartaDateString(startOfDay) !== date) {
      return error(res, 400, "Tanggal tidak valid");
    }

    if (
      !(startTime < lateThreshold &&
        lateThreshold < endTime)
    ) {
      return error(
        res,
        400,
        "Urutan waktu harus startTime < lateThreshold < endTime"
      );
    }

    const existingSession = await AttendanceSession.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingSession) {
      return error(res, 409, "Sesi untuk tanggal tersebut sudah ada");
    }

    const session = await AttendanceSession.create({
      date: startOfDay,
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
    const { startOfDay, endOfDay } = getJakartaDayRange();

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
