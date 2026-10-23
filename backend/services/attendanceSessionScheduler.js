const cron = require("node-cron");
const AttendanceSession = require("../models/AttendanceSession");
const { getJakartaDateString, getJakartaDayRange } = require("../utils/jakartaDate");

const TIMEZONE = "Asia/Jakarta";

// membuat sesi absensi untuk hari ini
const createTodaySession = async (req, res) => {
  try {
    const dateString = getJakartaDateString();
    const { startOfDay, endOfDay } =
      getJakartaDayRange(dateString);

    const existingSession = await AttendanceSession.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingSession) {
      console.log(`Sesi absensi sudah tersedia.`);
      return;
    }

    const session = await AttendanceSession.create({
      date: startOfDay,
      startTime: "06:00",
      lateThreshold: "06:45",
      endTime: "07:30",
    });

    console.log(
      `Sesi ${dateString} berhasil dibuat. ID: ${session._id}`,
    );
  } catch (err) {
    console.error("Gagal membuat sesi absensi:", err.message);
  }
};

const startAttendanceSessionScheduler = () => {
    cron.schedule(
        "50 5 * * 1-5",
        async () => {
            console.log("Cron berjalan:", new Date().toISOString());
            await createTodaySession();
        },
        {
            timezone: TIMEZONE,
        },
    );

    console.log("Scheduler sesi absensi aktif: Senin - Jumat pukul 06:50 WIB.");
};

module.exports = {
    createTodaySession,
    startAttendanceSessionScheduler
};
