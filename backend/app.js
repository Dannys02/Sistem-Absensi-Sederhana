require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/database");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const {
  startAttendanceSessionScheduler,
} = require("./services/attendanceSessionScheduler");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API URL
app.use("/api/", publicRoutes);
app.use("/api/admin/", adminRoutes);
app.use("/api/siswa/", siswaRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AbsensiKu API is running" });
});

// Error handler (harus setelah semua route)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    // Hubungkan database terlebih dahulu
    console.log("MongoDB connected");

    // Aktifkan scheduler setelah database terhubung
    startAttendanceSessionScheduler();

    // Jalankan server
    app.listen(PORT, () => {
      console.log(`Server berjalan di localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Gagal memulai server:", err.message);
    process.exit(1);
  }
};

startServer();