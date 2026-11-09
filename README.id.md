# AbsensiKu 📍⏱️

> 🌐 **Bahasa:** [English](./README.md) | **Bahasa Indonesia**

**AbsensiKu** adalah aplikasi web manajemen kehadiran (absensi) sekolah modern yang dirancang untuk mencatat absensi siswa secara real-time, akurat, dan transparan antara siswa, pihak sekolah, dan orang tua.

---

## 🎯 Mengapa Aplikasi Ini Dibuat? (Latar Belakang & Solusi)

Pencatatan absensi manual di sekolah kerap menghadapi berbagai kendala:
1. **Titip Absen & Manipulasi Kehadiran:** Siswa absen dari rumah atau menitipkan akun ke teman.
   - **Solusi AbsensiKu:** Dilengkapi fitur **Geofencing (GPS & Radius)**. Siswa hanya dapat check-in jika posisi GPS perangkatnya terdeteksi berada di dalam radius area sekolah/gedung yang telah diizinkan oleh admin.
2. **Keterlambatan yang Tidak Terdata Akurat:** Sulit memisahkan mana siswa yang hadir tepat waktu vs telat.
   - **Solusi AbsensiKu:** Jam buka sesi, batas terlambat, dan jam tutup absensi diatur otomatis oleh sistem. Status "Hadir" atau "Telat" ditentukan secara presisi oleh server.
3. **Surat Izin/Sakit Hilang atau Fiktif:**
   - **Solusi AbsensiKu:** Siswa dapat mengunggah **bukti foto surat dokter atau surat orang tua** langsung ke aplikasi untuk ditinjau sebelum disetujui atau ditolak oleh admin.
4. **Siswa Lupa Absen & Orang Tua Tidak Tahu:**
   - **Solusi AbsensiKu:** Notifikasi otomatis melalui **WhatsApp** dan **Email** untuk mengingatkan siswa yang belum absen sebelum sesi ditutup, serta memberi tahu hasil persetujuan surat izin.
5. **Rekap Laporan yang Memakan Waktu:**
   - **Solusi AbsensiKu:** Ekspor laporan kehadiran instan ke format **Excel (CSV)** atau cetak dokumen **PDF resmi siap pakai via Puppeteer**.

---

## ✨ Fitur Utama

### 👨‍🎓 Sisi Siswa
- **Check-in Absensi Real-time:** Check-in sekali klik dengan validasi koordinat GPS perangkat.
- **Pengajuan Izin / Sakit Online:** Formulir pengajuan izin disertai fitur unggah berkas surat dokter/surat izin (JPG, PNG, PDF).
- **Riwayat Kehadiran Pribadi:** Memantau riwayat absen harian dan status pengajuan izin secara transparan.

### 👨‍💼 Sisi Admin (Sekolah)
- **Dashboard Statistik:** Ringkasan jumlah kelas, total siswa terdaftar, kehadiran hari ini, izin pending, dan daftar siswa yang belum absen.
- **Manajemen Titik Lokasi (Geofencing):** Menambah titik koordinat sekolah, menentukan radius toleransi (meter), serta menyalakan/mematikan area absensi sewaktu-waktu.
- **Otomasi Sesi & Alpha Otomatis:** Sesi absensi berjalan harian secara otomatis. Siswa yang tidak hadir hingga jam sesi berakhir otomatis ditandai **Alpha** oleh sistem (*cron scheduler*).
- **Persetujuan Izin & Pratinjau Dokumen:** Meninjau surat dokter/surat orang tua secara langsung melalui modal pratinjau sebelum menyetujui atau menolak izin.
- **Rekap & Laporan Lengkap:** Filter rekapitulasi berdasarkan kelas, status absensi, dan rentang tanggal dengan ekspor CSV & cetak PDF langsung.
- **Notifikasi WhatsApp & Email:** Pemberitahuan pengingat belum absen dan status izin secara otomatis.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** React (Vite), Tailwind CSS, Lucide React, Axios.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB & Mongoose.
- **Validasi & Autentikasi:** JWT (JSON Web Token), Joi, Bcrypt.
- **PDF & Dokumen:** Puppeteer (Server-side PDF generation), Multer (File Upload).
- **Notifikasi & Scheduler:** Node-Cron, WhatsApp Gateway (Fonnte), Nodemailer (SMTP).

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Persiapan Awal
Pastikan komputer sudah terpasang:
- [Node.js](https://nodejs.org/) (versi 18 ke atas)
- MongoDB (Lokal atau MongoDB Atlas)

### 2. Konfigurasi Backend
1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Pasang seluruh package:
   ```bash
   npm install
   ```
3. Salin file lingkungan `.env`:
   ```bash
   cp .env.example .env
   ```
4. Sesuaikan isi file `.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/absensiku
   PORT=5000
   JWT_SECRET=absensiku_super_secret_123
   JWT_EXPIRE=1d

   # Opsional (untuk WhatsApp & Email)
   FONNTE_TOKEN=token_fonnte_anda
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=email_anda@gmail.com
   SMTP_PASS=app_password_anda
   ```
5. Jalankan server backend:
   ```bash
   npm run dev
   ```

### 3. Konfigurasi Frontend
1. Buka terminal baru dan masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Pasang seluruh package:
   ```bash
   npm install
   ```
3. Pastikan file `.env` di frontend mengarah ke backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Jalankan server frontend:
   ```bash
   npm run dev
   ```
5. Buka tautan di browser: `http://localhost:5173`

---

## 📖 Panduan Penggunaan Singkat

### A. Alur Admin Pertama Kali:
1. Login menggunakan akun Admin.
2. Buka menu **Manajemen Kelas** untuk menambahkan daftar kelas (misal: *X RPL 1*).
3. Buka menu **Lokasi Absensi** dan buat titik pusat sekolah (gunakan tombol *"Ambil Titik"* untuk memakai GPS saat ini atau isi koordinat dan radius toleransi misal 100 meter).
4. Buka menu **Otomasi Sesi** untuk menentukan jam buka sesi absensi harian (misal: 06.00 - 07.00 WIB).
5. Daftarkan akun siswa di menu **Manajemen Siswa** (sertakan nomor WhatsApp).

### B. Alur Siswa Absen:
1. Siswa login menggunakan email dan password yang telah didaftarkan.
2. Di halaman dashboard, pastikan izin lokasi (GPS) pada browser telah diizinkan.
3. Klik tombol **"Absen Sekarang"** saat sudah berada di area sekolah. Sistem akan otomatis memvalidasi koordinat siswa terhadap radius sekolah.
4. Jika berhalangan hadir, klik tombol **"Ajukan Izin/Sakit"**, tulis alasan, dan unggah foto surat keterangan dokter/orang tua.
