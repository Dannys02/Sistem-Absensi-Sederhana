const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const AttendanceSession = require("../models/AttendanceSession");
const { success, error } = require("../utils/responseHelper");

const checkIn = async (req, res) => {
  try {
    // cari data siswa berdasarkan user yang sedang login
    const student = await Student.findOne({
      userId: req.user.id,
    });

    if (!student) {
      return error(res, 404, "Data siswa tidak ditemukan");
    }

    // cari sesi absensi hari ini
    const today = new Date();

    const startOfDay = new Date(
      Date.UTC(
        today.getUTCFullYear(), 
        today.getUTCMonth(), 
        today.getUTCDate()
      ),
    );

    const endOfDay = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() + 1,
      ),
    );

    const session = await AttendanceSession.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    if (!session) {
      return error(res, 404, "Sesi absensi hari ini belum tersedia");
    }

    // cek apakah siswa sudah absen
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      sessionId: session._id,
    });

    if (existingAttendance) {
      return error(res, 400, "Anda sudah melakukan absensi hari ini");
    }

    const checkInTime = new Date();

    // menentukan status
    const status =
      checkInTime <= new Date(session.lateThreshold) ? "Hadir" : "Telat";

    // simpan absesi
    const attendance = await Attendance.create({
      studentId: student._id,
      sessionId: session._id,
      checkInTime,
      status,
    });

    success(res, 201, "Berhasil melakukan absensi", attendance);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

module.exports = {
  checkIn,
};
