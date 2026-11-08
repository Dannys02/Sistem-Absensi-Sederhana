const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Location = require("../models/Location");
const AttendanceSession = require("../models/AttendanceSession");
const puppeteer = require("puppeteer");
const { getDistanceInMeters } = require("../utils/geoHelper");
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

    // --- Validasi Geofencing / Titik Lokasi Absensi ---
    const activeLocations = await Location.find({ isActive: true });

    let matchedLocation = null;
    let shortestDistance = null;
    let closestLocationName = "";

    // Jika admin telah mengatur minimal 1 lokasi aktif, wajibkan validasi posisi siswa
    if (activeLocations.length > 0) {
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        return error(
          res,
          400,
          "Lokasi GPS tidak terdeteksi. Harap aktifkan izin lokasi (GPS) pada perangkat Anda untuk check-in."
        );
      }

      const userLat = Number(latitude);
      const userLng = Number(longitude);

      if (isNaN(userLat) || isNaN(userLng)) {
        return error(res, 400, "Data koordinat GPS tidak valid");
      }

      // Cek jarak siswa ke setiap lokasi aktif
      for (const loc of activeLocations) {
        const distance = getDistanceInMeters(userLat, userLng, loc.latitude, loc.longitude);

        if (shortestDistance === null || distance < shortestDistance) {
          shortestDistance = distance;
          closestLocationName = loc.name;
        }

        if (distance <= loc.radius) {
          matchedLocation = {
            id: loc._id,
            name: loc.name,
            distance,
          };
          break; // Siswa berada di dalam radius lokasi ini
        }
      }

      if (!matchedLocation) {
        return error(
          res,
          403,
          `Anda berada di luar area absensi. Jarak Anda sekitar ${Math.round(shortestDistance)} meter dari ${closestLocationName}. Pastikan Anda berada di lokasi yang ditentukan.`
        );
      }
    }

    const status = checkInTime <= lateDateTime ? "Hadir" : "Telat";

    // simpan absensi
    const attendance = await Attendance.create({
      studentId: student._id,
      sessionId: session._id,
      checkInTime,
      status,
      locationId: matchedLocation ? matchedLocation.id : null,
      locationName: matchedLocation ? matchedLocation.name : null,
      userCoordinates: req.body.latitude !== undefined && req.body.longitude !== undefined ? {
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude),
      } : undefined,
      distanceMeters: matchedLocation ? matchedLocation.distance : null,
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

    // Jika isExport=true, kembalikan semua data tanpa limit & skip pagination
    const isExport = req.query.isExport === "true";
    if (isExport) {
      const allAttendance = await Attendance.find(attendanceFilter)
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
        .sort({ createdAt: -1, _id: -1 });

      return success(res, 200, "Berhasil mengambil seluruh data rekap untuk export", {
        data: allAttendance,
        pagination: {
          page: 1,
          limit: totalData,
          totalData,
          totalPages: 1,
        },
      });
    }

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

// Download PDF Rekap menggunakan Puppeteer
const downloadAttendanceRecapPdf = async (req, res) => {
  let browser = null;
  try {
    const { date, startDate, endDate, classId, studentId, status: statusQuery } = req.query;

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
    let dateFilterLabel = "Semua Tanggal";

    if (date) {
      if (!validDate(date)) {
        return error(res, 400, "Format date harus YYYY-MM-DD");
      }
      const { startOfDay, endOfDay } = getJakartaDayRange(date);
      sessionFilter.date = { $gte: startOfDay, $lt: endOfDay };
      dateFilterLabel = new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
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
      sessionFilter.date = { $gte: startOfDay, $lt: endOfDay };

      const fStart = new Date(startDate).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
      const fEnd = new Date(endDate).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
      dateFilterLabel = `${fStart} s/d ${fEnd}`;
    }

    const attendanceFilter = {};

    if (Object.keys(sessionFilter).length > 0) {
      const sessions = await AttendanceSession.find(sessionFilter).select("_id");
      attendanceFilter.sessionId = {
        $in: sessions.map((session) => session._id),
      };
    }

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
      if (!statuses.every((s) => allowedStatuses.includes(s))) {
        return error(res, 400, "Status absensi tidak valid");
      }
      attendanceFilter.status = { $in: statuses };
    }

    const studentFilter = {};
    let classNameLabel = "Semua Kelas";

    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return error(res, 400, "Format ID kelas tidak valid");
      }
      studentFilter.classId = classId;
      const foundClass = await Class.findById(classId);
      if (foundClass) classNameLabel = foundClass.name;
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
        $in: students.map((s) => s._id),
      };
    }

    const attendanceList = await Attendance.find(attendanceFilter)
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
      .sort({ createdAt: -1, _id: -1 });

    const printedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: "Asia/Jakarta",
    });

    const formatTanggal = (dateStr) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
    };

    const formatJam = (dateStr) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    };

    const statusBadgeClass = (s) => {
      switch (s) {
        case "Hadir":
          return "background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;";
        case "Telat":
          return "background: #fef3c7; color: #92400e; border: 1px solid #fde68a;";
        case "Izin":
          return "background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;";
        case "Sakit":
          return "background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff;";
        case "Alpha":
          return "background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3;";
        default:
          return "background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;";
      }
    };

    const rowsHtml = attendanceList.length === 0
      ? `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">Tidak ada data absensi yang sesuai filter</td></tr>`
      : attendanceList.map((row, idx) => {
          const student = row.studentId || {};
          const user = student.userId || {};
          const kls = student.classId || {};
          const session = row.sessionId || {};
          const st = row.status || "-";
          const badgeStyle = statusBadgeClass(st);

          return `
            <tr>
              <td style="text-align: center; color: #64748b;">${idx + 1}</td>
              <td style="font-weight: 600; color: #0f172a;">${user.name || "-"}</td>
              <td>${student.nis || "-"}</td>
              <td>${kls.name || "-"}</td>
              <td>${formatTanggal(session.date || row.createdAt)}</td>
              <td>${row.checkInTime ? formatJam(row.checkInTime) + " WIB" : "-"}</td>
              <td style="text-align: center;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; ${badgeStyle}">
                  ${st}
                </span>
              </td>
              <td style="color: #475569;">${row.reason || "-"}</td>
            </tr>
          `;
        }).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Rekapitulasi Absensi</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 24px 30px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header-table {
            width: 100%;
            margin-bottom: 16px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
          }
          .title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 12px;
            color: #475569;
            margin-top: 2px;
            font-weight: 500;
          }
          .meta-grid {
            display: table;
            width: 100%;
            margin-bottom: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
          }
          .meta-row {
            display: table-row;
          }
          .meta-cell {
            display: table-cell;
            padding: 3px 10px 3px 0;
            font-size: 11px;
          }
          .meta-label {
            color: #64748b;
            font-weight: 500;
          }
          .meta-val {
            color: #0f172a;
            font-weight: 600;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          table.data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 600;
            text-align: left;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            text-transform: uppercase;
            font-size: 9.5px;
            letter-spacing: 0.3px;
          }
          table.data-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            vertical-align: middle;
          }
          table.data-table tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .footer-note {
            margin-top: 18px;
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="vertical-align: middle;">
              <div class="title">Laporan Rekapitulasi Absensi Siswa</div>
              <div class="subtitle">Sistem Informasi Manajemen Absensi - AbsensiKu</div>
            </td>
            <td style="text-align: right; vertical-align: middle; color: #64748b; font-size: 10px;">
              Dokumen Resmi Sistem
            </td>
          </tr>
        </table>

        <div class="meta-grid">
          <div class="meta-row">
            <div class="meta-cell"><span class="meta-label">Kelas:</span> <span class="meta-val">${classNameLabel}</span></div>
            <div class="meta-cell"><span class="meta-label">Filter Status:</span> <span class="meta-val">${statusQuery || "Semua Status"}</span></div>
          </div>
          <div class="meta-row">
            <div class="meta-cell"><span class="meta-label">Periode Tanggal:</span> <span class="meta-val">${dateFilterLabel}</span></div>
            <div class="meta-cell"><span class="meta-label">Total Data:</span> <span class="meta-val">${attendanceList.length} Baris Absensi</span></div>
          </div>
          <div class="meta-row">
            <div class="meta-cell" style="padding-top: 5px;"><span class="meta-label">Waktu Cetak:</span> <span class="meta-val">${printedAt} WIB</span></div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No</th>
              <th>Nama Siswa</th>
              <th style="width: 75px;">NIS</th>
              <th style="width: 80px;">Kelas</th>
              <th style="width: 90px;">Tanggal</th>
              <th style="width: 80px;">Waktu Absen</th>
              <th style="width: 70px; text-align: center;">Status</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer-note">
          <span>Dicetak secara otomatis oleh sistem AbsensiKu</span>
          <span>Halaman 1 dari 1</span>
        </div>
      </body>
      </html>
    `;

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });

    await browser.close();
    browser = null;

    const safeDate = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Absensi_${safeDate}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error("Puppeteer PDF generation error:", err);
    return error(res, 500, `Gagal mencetak PDF: ${err.message}`);
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
  downloadAttendanceRecapPdf,
};
