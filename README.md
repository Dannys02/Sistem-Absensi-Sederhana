# AbsensiKu 📍⏱️

> 🌐 **Language:** **English** | [Bahasa Indonesia](./README.id.md)

**AbsensiKu** is a modern web-based school attendance management application designed to record student attendance in real-time, accurately, and transparently between students, school administrators, and parents.

---

## 🎯 Why Was This Built? (Problem & Solution)

Manual attendance tracking in schools often faces several recurring challenges:
1. **Proxy Attendance & Manipulation:** Students checking in from home or asking friends to check in for them.
   - **AbsensiKu Solution:** Equipped with **Geofencing (GPS & Radius Validation)**. Students can only check in if their device's GPS coordinates are within the allowed radius of the school/building configured by the admin.
2. **Inaccurate Late Tracking:** Difficulty distinguishing on-time arrivals from late arrivals.
   - **AbsensiKu Solution:** Session start time, late threshold, and closing time are automatically enforced by the server. "Present" (*Hadir*) or "Late" (*Telat*) status is determined with precision.
3. **Lost or Fake Leave/Sick Letters:**
   - **AbsensiKu Solution:** Students can upload **proof of doctor's notes or parent letters** directly into the application for the admin to preview before approving or rejecting.
4. **Students Forgetting to Check In & Uninformed Parents:**
   - **AbsensiKu Solution:** Automated **WhatsApp** and **Email** notifications remind students who haven't checked in before the session closes, and immediately notify them when a leave request is approved or rejected.
5. **Time-Consuming Monthly Recap Reports:**
   - **AbsensiKu Solution:** Instant attendance report exports to **Excel (CSV)** or direct official **PDF generation powered by Puppeteer**.

---

## ✨ Key Features

### 👨‍🎓 Student Portal
- **Real-time GPS Check-in:** One-click attendance check-in with live device coordinate verification.
- **Online Leave / Sick Request:** Submit leave or sick requests along with supporting documents (JPG, PNG, PDF).
- **Personal Attendance History:** Track daily attendance status and leave approval results transparently.

### 👨‍💼 Admin Portal (School)
- **Analytics Dashboard:** Summary of total classes, registered students, today's attendance, pending leave requests, and a list of students who haven't checked in today.
- **Location Management (Geofencing):** Add multiple school coordinates, set tolerance radius (in meters), and toggle locations active/inactive anytime.
- **Session Automation & Auto-Alpha:** Daily attendance sessions run automatically. Students who do not check in by the session's end time are automatically marked **Alpha (Absent)** via a background *cron scheduler*.
- **Leave Approval & Document Preview:** Inspect uploaded doctor's notes or parent letters directly in a preview modal before approving or rejecting.
- **Comprehensive Recap & Export:** Filter attendance records by class, status, and date range, then export to CSV or download an official PDF report.
- **WhatsApp & Email Notifications:** Automated reminders for unattended students and instant leave status updates.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide React, Axios.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB & Mongoose.
- **Validation & Auth:** JWT (JSON Web Token), Joi, Bcrypt.
- **PDF & File Handling:** Puppeteer (Server-side PDF generation), Multer (Document upload).
- **Notifications & Scheduler:** Node-Cron, WhatsApp Gateway (Fonnte), Nodemailer (SMTP).

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- MongoDB (Local instance or MongoDB Atlas)

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Configure your `.env` variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/absensiku
   PORT=5000
   JWT_SECRET=absensiku_super_secret_123
   JWT_EXPIRE=1d

   # Optional (for WhatsApp & Email notifications)
   FONNTE_TOKEN=your_fonnte_token
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` points to your backend API:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser at: `http://localhost:5173`

---

## 📖 Quick Usage Guide

### A. Initial Admin Workflow:
1. Log in using an Admin account.
2. Go to **Class Management** (*Manajemen Kelas*) to create classes (e.g., *X RPL 1*).
3. Go to **Attendance Locations** (*Lokasi Absensi*) and add your school's coordinates (use the *"Get Current Location"* button or input Latitude, Longitude, and Radius manually, e.g., 100 meters).
4. Go to **Session Automation** (*Otomasi Sesi*) to configure daily check-in hours (e.g., 06:00 - 07:00 WIB).
5. Register student accounts in **Student Management** (*Manajemen Siswa*) along with their WhatsApp numbers.

### B. Student Attendance Workflow:
1. Log in using a registered Student account.
2. On the dashboard, allow browser location (GPS) permissions when prompted.
3. Click **"Absen Sekarang"** (Check In Now) while within the school radius. The system will verify your coordinates against active school locations.
4. If unable to attend, click **"Ajukan Izin/Sakit"** (Request Leave/Sick), write the reason, and upload a photo or PDF of the supporting letter.
