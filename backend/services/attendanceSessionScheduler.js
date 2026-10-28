const cron = require("node-cron");
const AttendanceSession = require("../models/AttendanceSession");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const {
  getJakartaDateString,
  getJakartaDayRange,
  getJakartaDateTime,
} = require("../utils/jakartaDate");

const TIMEZONE = "Asia/Jakarta";

// Membuat sesi absensi untuk hari ini
const createTodaySession = async () => {
  try {
    const dateString = getJakartaDateString();
    const { startOfDay, endOfDay } = getJakartaDayRange(dateString);

    const existingSession = await AttendanceSession.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingSession) {
      console.log("Sesi absensi sudah tersedia.");
      return;
    }

    const session = await AttendanceSession.create({
      date: startOfDay,
      startTime: "06:00",
      lateThreshold: "06:45",
      endTime: "07:30",
    });

    console.log(`Sesi ${dateString} berhasil dibuat. ID: ${session._id}`);
  } catch (err) {
    console.error("Gagal membuat sesi absensi:", err.message);
  }
};

// Memproses Alpha untuk sesi yang sudah berakhir
const processAbsentStudents = async () => {
  try {
    const now = new Date();

    const sessions = await AttendanceSession.find();

    for (const session of sessions) {
      const sessionDate = getJakartaDateString(session.date);
      const endDateTime = getJakartaDateTime(sessionDate, session.endTime);

      // Lewati sesi yang belum berakhir
      if (now < endDateTime) continue;

      // Cari siswa yang belum punya catatan absensi   
      const students = await Student.find().select("_id");

      if (students.length === 0) continue;

      const operations = students.map((student) => ({
        updateOne: {
          filter: {
            studentId: student._id,
            sessionId: session._id,
          },
          update: {
            $setOnInsert: {
              studentId: student._id,
              sessionId: session._id,
              status: "Alpha",
            },
          },
          upsert: true,
        },
      }));

      const result = await Attendance.bulkWrite(operations);
      
      console.log(
        `Sesi ${session._id}: ` +
        `${result.upsertedCount} siswa baru diberi Alpha.`,
      );
    }
  } catch (err) {
    console.error("Gagal memproses Alpha:", err.message);
  }
};

// Menjalankan scheduler
const startAttendanceSessionScheduler = () => {
  // Membuat sesi setiap Senin-Jumat pukul 06:50 WIB
  cron.schedule(
    "* * * * *",
    async () => {
      console.log("Cron pembuatan sesi berjalan.");
      await createTodaySession();
    },
    { timezone: TIMEZONE },
  );

  // Memeriksa Alpha setiap 5 menit
  cron.schedule(
    "*/5 * * * *",
    async () => {
      await processAbsentStudents();
    },
    { timezone: TIMEZONE },
  );

  console.log("Scheduler sesi dan Alpha aktif.");
};

module.exports = {
  createTodaySession,
  processAbsentStudents,
  startAttendanceSessionScheduler,
};
