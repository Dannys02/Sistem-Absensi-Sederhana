require("dotenv").config();
const mongoose = require("mongoose");
const AttendanceSession = require("./models/AttendanceSession");

const { createTodaySession } = require("./services/attendanceSessionScheduler");

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'absensiku'});

    console.log("1. Database aktif:", mongoose.connection.name);

    const jumlahSesi = await AttendanceSession.countDocuments();
    console.log("2. Jumlah sesi di database:", jumlahSesi);

    const semuaSesi = await AttendanceSession.find({});
    console.log("3. Data sesi yang ditemukan:", semuaSesi);

    console.log("4. Menjalankan scheduler...");
    await createTodaySession();
  } catch (err) {
    console.error("Terjadi error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
