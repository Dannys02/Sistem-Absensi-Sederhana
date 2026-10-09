const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const AttendanceSession = require("../models/AttendanceSession");
const { success, error } = require("../utils/responseHelper");
const mongoose = require("mongoose");

// area siswa
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

// area admin
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

const getAttendanceRecapByAdmin = async (req, res) => {
  try {
    const { date, classId } = req.query;

    // filter berdasarkan kelas
    const studentFilter = {};

    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return error(res, 400, " Format ID kelas tidak valid");
      }

      studentFilter.classId = classId;
    }

    const students = await Student.find(studentFilter).select("_id");
    const studentIds = students.map((student) => student._id);

    // filter berdasarkan tanggal sesi
    const sessionFilter = {};
    
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return error(res, 400, "Format tanggal harus YYYY-MM-DD");
      }

      const parsedDate = new Date(`${date}T00:00:00.000Z`);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        return error(res, 400, "Tanggal tidak valid");
      }

      const nextDate = new Date(parsedDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);

      sessionFilter.date = {
        $gte: parsedDate,
        $lt: nextDate,
      };
    }

    const sessions = await AttendanceSession.find(sessionFilter).select("_id");
    const sessionIds = sessions.map((session) => session._id);

    // Gabungkan filter ke query Attendance
    const attendanceFilter = {};

    if (classId) {
      attendanceFilter.studentId = { $in: studentIds };
    }

    if (date) {
      attendanceFilter.sessionId = { $in: sessionIds };
    }

    const attendance = await Attendance.find(attendanceFilter)
      .populate({
        path: "studentId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "classId", select: "name" },
        ],
      })
      .populate({
        path: "sessionId",
        select: "date startTime lateThreshold endTime",
      })
      .sort({ createdAt: -1 });

    success(res, 200, "Berhasil mengambil rekap absensi", attendance);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// sistem otomatis
const markAbsentStudents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return error(res, 404, "Sesi absensi tidak ditemukan");
    }

    if (new Date() < new Date(session.endTime)) {
      return error(res, 400, "Sesi absensi belum berakhir");
    }

    const students = await Student.find();

    const existingAttendances = await Attendance.find({
      sessionId: session._id,
    }).select("studentId");

    const attendedStudentsId = existingAttendances.map((attendance) =>
      attendance.studentId.toString(),
    );

    const absentStudents = students.filter(
      (student) => !attendedStudentsId.includes(student._id.toString()),
    );

    if (absentStudents.length > 0) {
      await Attendance.insertMany(
        absentStudents.map((student) => ({
          studentId: student._id,
          sessionId: session._id,
          status: "Alpha",
        })),
      );
    }

    return success(res, 200, "Berhasil memproses absensi Alpha", {
      jumlahAlpha: absentStudents.length,
    });
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
  markAbsentStudents,
  getAttendanceRecapByAdmin,
};
