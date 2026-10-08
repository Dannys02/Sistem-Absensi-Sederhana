const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const AttendanceSession = require("../models/AttendanceSession");
const { success, error } = require("../utils/responseHelper");
const mongoose = require("mongoose");

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
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
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

    if (checkInTime >= new Date(session.endTime)) {
      return error(res, 400, "Sesi absensi sudah ditutup");
    }

    // menentukan status hadir atau telat
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

const getAttendanceByStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      userId: req.user.id,
    });

    if (!student) {
      return error(res, 404, "Data siswa tidak ditemukan");
    }

    const attendanceRecords = await Attendance.find({
      studentId: student._id,
    })
      .populate("sessionId")
      .sort({ checkInTime: -1 });

    success(res, 200, "Berhasil mengambil data absensi", attendanceRecords);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const submitLeaveRequest = async (req, res) => {
  try {
    const { requestType, reason } = req.body;

    // cari student berdasarkan user yang login
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return error(res, 404, "Data siswa tidak ditemukan");
    }

    const today = new Date();

    const startOfDay = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
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

    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      sessionId: session._id,
    });

    if (existingAttendance) {
      return error(res, 400, "Anda sudah melakukan absensi hari ini");
    }

    const now = new Date();
    if (now >= new Date(session.endTime)) {
      return error(res, 400, "Sesi absensi sudah ditutup");
    }

    if (!["Izin", "Sakit"].includes(requestType)) {
      return error(res, 400, "Jenis pengajuan harus Izin atau Sakit");
    }

    const attendance = await Attendance.create({
      studentId: student._id,
      sessionId: session._id,
      status: "Menunggu Approval",
      requestType,
      reason,
    });

    success(res, 200, "Berhasil mengajukan izin/sakit", attendance);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const getSubmitLeaveRequestByAdmin = async (req, res) => {
  const attendance = await Attendance.find({
    status: "Menunggu Approval",
  });

  success(
    res,
    200,
    "Berhasil mengambil data absensi yang mengajukan izin/sakit",
    attendance,
  );
};

const approvedAttendanceLeaveByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID absensi siswa tidak valid");
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return error(res, 404, "Pengajuan absensi tidak ditemukan");
    }

    if (attendance.status !== "Menunggu Approval") {
      return error(res, 400, "Pengajuan absensi sudah diproses");
    }

    attendance.status = attendance.requestType;
    attendance.approvedBy = req.user.id;

    await attendance.save();

    success(
      res,
      200,
      "Berhasil menyetujui pengajuan absensi siswa",
      attendance,
    );
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const rejectAttendanceLeaveByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID absensi siswa tidak valid");
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return error(res, 404, "Pengajuan absensi tidak ditemukan");
    }

    if (attendance.status !== "Menunggu Approval") {
      return error(res, 404, "Pengajuan absensi sudah diproses");
    }

    attendance.status = "Alpha";
    attendance.approvedBy = req.user.id;

    await attendance.save();
    success(res, 200, "Berhasil menolak pengajuan absensi siswa", attendance);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

module.exports = {
  checkIn,
  getAttendanceByStudent,
  submitLeaveRequest,
  getSubmitLeaveRequestByAdmin,
  approvedAttendanceLeaveByAdmin,
  rejectAttendanceLeaveByAdmin,
};
