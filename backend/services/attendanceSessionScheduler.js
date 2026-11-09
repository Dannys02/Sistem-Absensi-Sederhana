const cron = require("node-cron");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceSetting = require("../models/AttendanceSetting");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const { sendWhatsApp, sendEmail } = require("./notificationService");

const {
  getJakartaDateString,
  getJakartaTimeString,
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

    // 4. Cek apakah waktu sekarang sudah memasuki jam mulai absensi (Konsep 1)
    const currentJakartaTime = getJakartaTimeString();
    if (currentJakartaTime < setting.startTime) {
      // Belum memasuki jam mulai masuk absensi, jangan buat sesi dulu
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

// Set untuk menyimpan ID sesi yang sudah dikirimi notifikasi reminder hari ini agar tidak duplikat
const remindedSessions = new Set();

// Mengirimkan notifikasi reminder kepada siswa yang BELUM absen sebelum sesi berakhir
const notifyUnattendedStudents = async () => {
  try {
    const now = new Date();
    const dateString = getJakartaDateString();
    const { startOfDay, endOfDay } = getJakartaDayRange(dateString);

    const session = await AttendanceSession.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!session) return;

    // Jika sesi hari ini sudah pernah dikirimi pengingat broadcast, lewati
    if (remindedSessions.has(session._id.toString())) return;

    const endDateTime = getJakartaDateTime(dateString, session.endTime);
    const startDateTime = getJakartaDateTime(dateString, session.startTime);

    // Kirim notifikasi jika waktu sekarang berada di antara jam mulai dan 20 menit sebelum jam tutup
    // Misal: sisa waktu 20 menit atau kurang sebelum sesi ditutup
    const diffInMinutes = (endDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (now >= startDateTime && diffInMinutes > 0 && diffInMinutes <= 25) {
      remindedSessions.add(session._id.toString());
      console.log(`[Notification Reminder] Mengirim notifikasi belum absen. Sisa waktu: ~${Math.round(diffInMinutes)} menit.`);

      const existingAttendances = await Attendance.find({
        sessionId: session._id,
      }).select("studentId");

      const studentIdsWithAttendance = existingAttendances.map((att) =>
        att.studentId.toString()
      );

      const unattendedStudents = await Student.find({
        _id: { $nin: studentIdsWithAttendance },
      })
        .populate("userId", "name email")
        .populate("classId", "name");

      if (unattendedStudents.length === 0) return;

      console.log(`[Notification Reminder] Terdapat ${unattendedStudents.length} siswa belum absen.`);

      // Dispatch notifikasi ke setiap siswa
      for (const student of unattendedStudents) {
        const studentName = student.userId?.name || "Siswa";
        const studentEmail = student.userId?.email;
        const studentPhone = student.phone || student.parentPhone;

        const messageText = `Halo *${studentName}*,\n\nPengingat absensi harian di *AbsensiKu*:\nSesi absensi hari ini akan segera ditutup pada pukul *${session.endTime} WIB* (tersisa sekitar ${Math.round(diffInMinutes)} menit lagi).\n\nSegera lakukan check-in kehadiran di aplikasi sebelum sesi ditutup agar tidak terdata Alpha.\n\nTerima kasih.`;

        // Kirim WhatsApp jika nomor tersedia
        if (studentPhone) {
          sendWhatsApp({
            to: studentPhone,
            message: messageText,
          }).catch((e) => console.error(`Gagal kirim WA ke ${studentName}:`, e.message));
        }

        // Kirim Email jika email tersedia
        if (studentEmail) {
          sendEmail({
            to: studentEmail,
            subject: `[Pengingat Absensi] Sesi Hari Ini Segera Berakhir (${session.endTime} WIB)`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #4F7942; margin-top: 0;">Pengingat Kehadiran AbsensiKu</h2>
                <p>Halo <strong>${studentName}</strong>,</p>
                <p>Sesi absensi hari ini akan ditutup pada pukul <strong>${session.endTime} WIB</strong> (tersisa kurang lebih ${Math.round(diffInMinutes)} menit lagi).</p>
                <p style="background: #fef3c7; color: #92400e; padding: 12px; border-radius: 8px; font-weight: 500;">
                  ⚠️ Anda belum tercatat melakukan absensi hari ini. Silakan segera buka aplikasi AbsensiKu dan lakukan check-in lokasi.
                </p>
                <p style="font-size: 12px; color: #64748b; margin-top: 30px;">
                  Pesan otomatis ini dikirimkan oleh sistem AbsensiKu.
                </p>
              </div>
            `,
          }).catch((e) => console.error(`Gagal kirim Email ke ${studentEmail}:`, e.message));
        }
      }
    }
  } catch (err) {
    console.error("Gagal mengirim pengingat siswa belum absen:", err.message);
  }
};

// Memproses Alpha HANYA untuk sesi HARI INI yang baru saja berakhir
const processAbsentStudents = async () => {
  try {
    const now = new Date();
    const dateString = getJakartaDateString();
    const { startOfDay, endOfDay } = getJakartaDayRange(dateString);

    // 1. Cari sesi HARI INI saja (tidak perlu query seluruh riwayat sesi lama)
    const session = await AttendanceSession.findOne({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    // Jika sesi hari ini belum ada, tidak ada yang perlu diproses
    if (!session) return;

    const endDateTime = getJakartaDateTime(dateString, session.endTime);

    // Jika sesi hari ini belum berakhir, jangan beri status Alpha
    if (now < endDateTime) return;

    // 2. Ambil seluruh catatan absensi yang sudah tercatat pada sesi hari ini
    // Termasuk yang statusnya: "Hadir", "Telat", "Izin", "Sakit", "Menunggu Approval", maupun "Alpha"
    const existingAttendances = await Attendance.find({
      sessionId: session._id,
    }).select("studentId");

    const studentIdsWithAttendance = existingAttendances.map((att) =>
      att.studentId.toString(),
    );

    // 3. Cari siswa yang SAMA SEKALI belum memiliki catatan absensi pada sesi ini
    // Siswa dengan permohonan izin/sakit yang statusnya 'Menunggu Approval'
    // secara aman TIDAK akan dimasukkan ke list ini karena record-nya sudah ada di database
    const studentsWithoutAttendance = await Student.find({
      _id: { $nin: studentIdsWithAttendance },
    }).select("_id");

    if (studentsWithoutAttendance.length === 0) return;

    // 4. Catat status Alpha untuk siswa yang belum absen
    const operations = studentsWithoutAttendance.map((student) => ({
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
        `[Scheduler Alpha] Sesi hari ini (${dateString}): ` +
        `${result.upsertedCount} siswa yang tidak hadir otomatis diberi status Alpha.`
      );
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

  // Memeriksa Alpha setiap 5 menit khusus untuk sesi hari ini yang baru berakhir
  cron.schedule(
    "*/5 * * * *",
    async () => {
      await processAbsentStudents();
    },
    { timezone: TIMEZONE },
  );

  // Memeriksa reminder notifikasi belum absen setiap 2 menit
  cron.schedule(
    "*/2 * * * *",
    async () => {
      await notifyUnattendedStudents();
    },
    { timezone: TIMEZONE },
  );

  console.log("Scheduler sesi dan Alpha aktif dengan konfigurasi dinamis & optimasi hari ini.");
};

module.exports = {
  createTodaySession,
  processAbsentStudents,
  notifyUnattendedStudents,
  startAttendanceSessionScheduler,
};
