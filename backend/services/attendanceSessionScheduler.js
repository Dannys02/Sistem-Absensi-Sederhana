const cron = require("node-cron");
const AttendanceSession = require("../models/AttendanceSession");

const TIMEZONE = "Asia/Jakarta";

// membuat sesi absensi untuk hari ini
const createTodaySession = async (req, res) => {
  try {
    const now = new Date();

    // ambil tanggal hari ini berdasarkan WIB
    const dateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const startOfDay = new Date(`${dateString}T00:00:00.000+07:00`);
    const endOfDay = new Date(`${dateString}T00:00:00.000+07:00`);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // cegah pembuatan sesi jika sesi hari ini sudah ada
    const existingSession = await AttendanceSession.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    console.log(existingSession);

    if (existingSession) {
      console.log(`Sesi absensi ${dateString} sudah tersedia.`);
      return;
    }

    const session = await AttendanceSession.create({
      date: startOfDay,
      // startTime: new Date(`${dateString}T07:00:00+07:00`),
      // lateThreshold: new Date(`${dateString}T07:00:00+07:00`),
      // endTime: new Date(`${dateString}T07:00:00+07:00`),
      startTime: "07:00",
      lateThreshold: "07:15",
      endTime: "08:00",
    });

    console.log(
      `Sesi absensi berhasil dibuat untuk ${dateString}. ID: ${session._id}`,
    );
  } catch (err) {
    console.error("Gagal membuat sesi absensi:", err.message);
  }
};

const startAttendanceSessionScheduler = () => {
    cron.schedule(
        "50 6 * * 1-5",
        async () => {
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
