const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Student = require("../models/Student");
const AttendanceSession = require("../models/AttendanceSession");
const {
  getJakartaDayRange,
  getJakartaDateString,
  getJakartaDateTime,
} = require("../utils/jakartaDate");
const { success, error } = require("../utils/responseHelper");
const mongoose = require("mongoose");

// area siswa
const checkIn = async (req, res) => {
  try {
    const { startOfDay, endOfDay } = getJakartaDayRange();

    // cari data siswa berdasarkan user yang sedang login
    const student = await Student.findOne({
      userId: req.user.id,
    });

    if (!student) {
      return error(res, 404, "Data siswa tidak ditemukan");
    }

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

    const sessionDate = getJakartaDateString(session.date);

    const startDateTime = getJakartaDateTime(sessionDate, session.startTime);

    const endDateTime = getJakartaDateTime(sessionDate, session.endTime);

    const lateDateTime = getJakartaDateTime(sessionDate, session.lateThreshold);

    if (checkInTime < startDateTime) {
      return error(res, 400, "Absensi belum dibuka");
    }

    if (checkInTime >= endDateTime) {
      return error(res, 400, "Sesi absensi sudah ditutup");
    }

    const status = checkInTime <= lateDateTime ? "Hadir" : "Telat";

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
    const { startOfDay, endOfDay } = getJakartaDayRange();

    // cari student berdasarkan user yang login
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return error(res, 404, "Data siswa tidak ditemukan");
    }

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

    const sessionDate = getJakartaDateString(session.date);

    const startDateTime = getJakartaDateTime(sessionDate, session.startTime);

    const endDateTime = getJakartaDateTime(sessionDate, session.endTime);

    if (now < startDateTime) {
      return error(res, 400, "Absensi belum dibuka");
    }

    if (now >= endDateTime) {
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
  }).populate({
    // ambil nama siswa (dari User) dan nama kelas untuk ditampilkan di halaman admin
    path: "studentId",
    select: "nis userId classId",
    populate: [
      { path: "userId", select: "name email" },
      { path: "classId", select: "name" },
    ],
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

const getStudentsWithoutAttendanceToday = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    let filter = {};
    if (search) {
      const users = await User.find({
        role: "siswa",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);

      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { userId: { $in: userIds } },
        ],
      };
    }

    const { startOfDay, endOfDay } = getJakartaDayRange();

    // cari sesi absensi hari ini
    const session = await AttendanceSession.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    // Jika sesi belum dibuat, berarti BELUM ADA siswa yang absen.
    // Maka semua siswa (sesuai filter search) dianggap belum absen.
    let attendedStudentIds = [];

    if (session) {
      // ambil ID siswa yang SUDAH memiliki catatan absensi jika sesi ada
      const attendances = await Attendance.find({
        sessionId: session._id,
      }).select("studentId");

      attendedStudentIds = attendances.map(
        (attendance) => attendance.studentId,
      );
    }

    // tambahkan kondisi LOGIKA UTAMA: Mengecualikan siswa yang sudah absen (_id NOT IN attendedStudentIds)
    if (attendedStudentIds.length > 0) {
      filter._id = { $nin: attendedStudentIds };
    }

    // hitung total data SETELAH filter digabungkan agar pagination akurat
    const totalData = await Student.countDocuments(filter);

    // 6. Cari siswa yang belum memiliki catatan absensi menggunakan filter terbaru
    const students = await Student.find(filter)
      .populate("userId", "name email")
      .populate("classId", "name")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return success(res, 200, "Berhasil mengambil siswa yang belum absen", {
      data: { students },
      pagination: {
        totalData,
        currentPage: parseInt(page),
        totalPage: Math.ceil(totalData / limit),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const getAttendanceRecapByAdmin = async (req, res) => {
  try {
    const { startDate, endDate, status, date, classId, studentId } = req.query;

    // 1. Validasi pagination
    const page = req.query.page === undefined ? 1 : Number(req.query.page);

    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return error(
        res,
        400,
        "page harus bilangan bulat positif dan limit harus 1-100",
      );
    }

    const skip = (page - 1) * limit;

    // 2. Validasi filter tanggal
    const validDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const parsed = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    };

    if (date && (startDate || endDate)) {
      return error(
        res,
        400,
        "Gunakan date atau startDate dan endDate, jangan keduanya",
      );
    }

    const sessionFilter = {};

    if (date) {
      if (!validDate(date)) {
        return error(res, 400, "Format date harus YYYY-MM-DD");
      }

      const { startOfDay, endOfDay } = getJakartaDayRange(date);
      sessionFilter.date = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    } else if (startDate || endDate) {
      if (!startDate || !endDate) {
        return error(res, 400, "startDate dan endDate harus diisi bersamaan");
      }

      if (!validDate(startDate) || !validDate(endDate)) {
        return error(res, 400, "Format tanggal harus YYYY-MM-DD");
      }

      if (startDate > endDate) {
        return error(res, 400, "startDate tidak boleh setelah endDate");
      }

      const { startOfDay } = getJakartaDayRange(startDate);
      const { endOfDay } = getJakartaDayRange(endDate);

      sessionFilter.date = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }

    // 3. Bangun filter absensi
    const attendanceFilter = {};

    if (Object.keys(sessionFilter).length > 0) {
      const sessions =
        await AttendanceSession.find(sessionFilter).select("_id");

      attendanceFilter.sessionId = {
        $in: sessions.map((session) => session._id),
      };
    }

    const statusQuery = req.query.status;

    if (statusQuery) {
      const statuses = Array.isArray(statusQuery) ? statusQuery : [statusQuery];
      const allowedStatuses = [
        "Hadir",
        "Telat",
        "Izin",
        "Sakit",
        "Alpha",
        "Menunggu Approval",
      ];

      if (!statuses.every((status) => allowedStatuses.includes(status))) {
        return error(res, 400, "Status absensi tidak valid");
      }

      attendanceFilter.status = { $in: statuses };
    }

    // 4. Filter kelas dan siswa
    const studentFilter = {};

    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return error(res, 400, "Format ID kelas tidak valid");
      }

      studentFilter.classId = classId;
    }

    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return error(res, 400, "Format ID siswa tidak valid");
      }

      studentFilter._id = studentId;
    }

    if (classId || studentId) {
      const students = await Student.find(studentFilter).select("_id");

      attendanceFilter.studentId = {
        $in: students.map((student) => student._id),
      };
    }

    // 5. Hitung total data sebelum pagination
    const totalData = await Attendance.countDocuments(attendanceFilter);

    const totalPages = Math.ceil(totalData / limit);

    // 6. Ambil data untuk halaman yang diminta
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
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    return success(res, 200, "Berhasil mengambil rekap absensi", {
      data: attendance,
      pagination: {
        page,
        limit,
        totalData,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1 && totalData > 0,
      },
    });
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

    const sessionDate = getJakartaDateString(session.date);
    const endDateTime = getJakartaDateTime(sessionDate, session.endTime);

    if (new Date() < endDateTime) {
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
  getStudentsWithoutAttendanceToday,
  getAttendanceRecapByAdmin,
};
