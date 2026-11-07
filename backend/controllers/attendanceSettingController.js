const AttendanceSetting = require("../models/AttendanceSetting");
const AttendanceSession = require("../models/AttendanceSession");
const { getJakartaDateString, getJakartaDayRange } = require("../utils/jakartaDate");
const { success, error } = require("../utils/responseHelper");

// Mendapatkan konfigurasi sesi absensi saat ini (atau buat default jika belum ada)
const getAttendanceSetting = async (req, res) => {
  try {
    let setting = await AttendanceSetting.findOne();

    if (!setting) {
      setting = await AttendanceSetting.create({
        startTime: process.env.START_TIME || "06:00",
        lateThreshold: process.env.LATE_THRESHOLD || "06:30",
        endTime: process.env.END_TIME || "07:00",
        activeDays: [1, 2, 3, 4, 5],
        isAutomated: true,
      });
    }

    return success(res, 200, "Berhasil mengambil pengaturan sesi absensi", setting);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// Memperbarui konfigurasi sesi absensi
const updateAttendanceSetting = async (req, res) => {
  try {
    const { startTime, lateThreshold, endTime, activeDays, isAutomated } = req.body;

    // Validasi format jam HH:mm
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (
      !timeRegex.test(startTime || "") ||
      !timeRegex.test(lateThreshold || "") ||
      !timeRegex.test(endTime || "")
    ) {
      return error(res, 400, "Format waktu harus HH:mm (contoh: 06:00)");
    }

    // Validasi urutan waktu
    if (!(startTime < lateThreshold && lateThreshold < endTime)) {
      return error(
        res,
        400,
        "Urutan jam harus: Jam Mulai < Batas Terlambat < Jam Selesai",
      );
    }

    // Validasi activeDays
    if (!Array.isArray(activeDays)) {
      return error(res, 400, "activeDays harus berupa array angka hari (0 - 6)");
    }

    const isValidDays = activeDays.every(
      (day) => Number.isInteger(day) && day >= 0 && day <= 6
    );
    if (!isValidDays) {
      return error(res, 400, "Nilai hari harus antara 0 (Minggu) sampai 6 (Sabtu)");
    }

    let setting = await AttendanceSetting.findOne();

    if (!setting) {
      setting = new AttendanceSetting();
    }

    setting.startTime = startTime;
    setting.lateThreshold = lateThreshold;
    setting.endTime = endTime;
    setting.activeDays = [...new Set(activeDays)].sort((a, b) => a - b);
    if (typeof isAutomated === "boolean") {
      setting.isAutomated = isAutomated;
    }

    await setting.save();

    // SINKRONISASI: Jika sesi hari ini sudah ada, perbarui jamnya agar langsung sinkron
    const dateString = getJakartaDateString();
    const { startOfDay, endOfDay } = getJakartaDayRange(dateString);

    const todaySession = await AttendanceSession.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (todaySession) {
      todaySession.startTime = startTime;
      todaySession.lateThreshold = lateThreshold;
      todaySession.endTime = endTime;
      await todaySession.save();
    }

    return success(
      res,
      200,
      todaySession
        ? "Pengaturan berhasil disimpan dan sesi absensi hari ini telah disinkronkan!"
        : "Pengaturan sesi absensi berhasil diperbarui",
      setting
    );
  } catch (err) {
    return error(res, 500, err.message);
  }
};

module.exports = {
  getAttendanceSetting,
  updateAttendanceSetting,
};
