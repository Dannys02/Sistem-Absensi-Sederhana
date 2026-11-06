const cron = require("node-cron");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceSetting = require("../models/AttendanceSetting");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const {
  getJakartaDateString,
  getJakartaDayRange,
  getJakartaDateTime,
} = require("../utils/jakartaDate");

const TIMEZONE = "Asia/Jakarta";

// Mendapatkan index hari saat ini di Asia/Jakarta (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
const getJakartaDayOfWeek = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(new Date());

  const daysMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return daysMap[parts] !== undefined ? daysMap[parts] : new Date().getDay();
};

// Membuat sesi absensi untuk hari ini berdasarkan pengaturan admin
const createTodaySession = async () => {
  try {
    // 1. Ambil pengaturan sesi dari database (atau fallback ke default / .env)
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

    // 2. Cek apakah otomasi sedang diaktifkan
    if (!setting.isAutomated) {
      return;
    }

    // 3. Cek apakah hari ini termasuk hari aktif otomasi
    const todayDay = getJakartaDayOfWeek();
    if (!setting.activeDays.includes(todayDay)) {
      return;
    }

    const dateString = getJakartaDateString();
    const { startOfDay, endOfDay } = getJakartaDayRange(dateString);

    const existingSession = await AttendanceSession.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingSession) {
      return;
    }

    const session = await AttendanceSession.create({
      date: startOfDay,
      startTime: setting.startTime,
      lateThreshold: setting.lateThreshold,
      endTime: setting.endTime,
    });

    console.log(`[Scheduler] Sesi ${dateString} otomatis dibuat. ID: ${session._id} (${setting.startTime} - ${setting.endTime})`);
  } catch (err) {
    console.error("Gagal membuat sesi absensi otomatis:", err.message);
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
      
      if (result.upsertedCount > 0) {
        console.log(
          `Sesi ${session._id}: ` +
          `${result.upsertedCount} siswa diberi Alpha.`
        );
      }
    }
  } catch (err) {
    console.error("Gagal memproses Alpha:", err.message);
  }
};

// Menjalankan scheduler
const startAttendanceSessionScheduler = () => {
  // Mengecek dan membuat sesi setiap menit (jika hari aktif & belum ada sesi)
  cron.schedule(
    "* * * * *",
    async () => {
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

  console.log("Scheduler sesi dan Alpha aktif dengan konfigurasi dinamis.");
};

module.exports = {
  createTodaySession,
  processAbsentStudents,
  startAttendanceSessionScheduler,
};
