import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  CheckCircle2,
  FileText,
  Stethoscope,
  XCircle,
  Clock,
  LogOut,
  Send,
  X,
  MapPin,
  Navigation,
  Paperclip,
  UploadCloud,
} from "lucide-react";

function Student() {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [attendedAt, setAttendedAt] = useState(null);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ requestType: "", reason: "" });
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState("");
  const [errorAttendance, setErrorAttendance] = useState("");
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [activeLocations, setActiveLocations] = useState([]);

  useEffect(() => {
    if (!showSuccess && !showError) return;

    const timer = setTimeout(() => {
      setShowSuccess(false);
      setShowError(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showSuccess, showError]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showModal]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const response = await api.get("/siswa/attendance/me");
      const dataResponse = response.data.data.map((item) => {
        const dateObj = new Date(item.createdAt);

        // mengambil Tanggal (Format: YYYY-MM-DD)
        const tahun = dateObj.getFullYear();
        const bulan = String(dateObj.getMonth() + 1).padStart(2, "0"); // Bulan dimulai dari 0
        const tanggal = String(dateObj.getDate()).padStart(2, "0");
        const tanggalLokal = `${tahun}-${bulan}-${tanggal}`;

        // mengambil Jam (Format: HH:MM:SS)
        const jam = String(dateObj.getHours()).padStart(2, "0");
        const menit = String(dateObj.getMinutes()).padStart(2, "0");
        const detik = String(dateObj.getSeconds()).padStart(2, "0");
        const jamLokal = `${jam}:${menit}:${detik}`;

        return {
          ...item,
          tanggalLokal: tanggalLokal,
          jam: jamLokal,
        };
      });

      setHistory(dataResponse);

      // Ambil tanggal hari ini berdasarkan WIB
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });

      // Cari absensi hari ini yang benar-benar check-in
      const attendanceToday = dataResponse.find((item) => {
        const attendanceDate = new Date(item.createdAt).toLocaleDateString(
          "en-CA",
          {
            timeZone: "Asia/Jakarta",
          },
        );

        return (
          attendanceDate === today &&
          [
            "Hadir",
            "Telat",
            "Alpha",
            "Izin",
            "Sakit",
            "Menunggu Approval",
          ].includes(item.status)
        );
      });

      setAttendedAt(
        attendanceToday ? new Date(attendanceToday.createdAt) : null,
      );
    } catch (err) {
      console.error("Gagal ambil data absensi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchActiveLocations();
  }, []);

  const fetchActiveLocations = async () => {
    try {
      const res = await api.get("/siswa/locations/active");
      setActiveLocations(res.data?.data || []);
    } catch (err) {
      console.error("Gagal mengambil data lokasi aktif:", err);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Hadir":
        return "text-[#4F7942]";
      case "Terlambat":
        return "text-amber-700";
      case "Izin":
        return "text-yellow-700";
      case "Sakit":
        return "text-blue-700";
      case "Alpha":
        return "text-red-700";
      default:
        return "text-gray-700";
    }
  };

  const formatTime = (d) =>
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const count = (status) => history.filter((h) => h.status === status).length;

  const stats = [
    {
      title: "Hadir",
      value: count("Hadir") + count("Telat"),
      unit: "Hari bulan ini",
      icon: <CheckCircle2 size={24} />,
    },
    {
      title: "Izin",
      value: count("Izin"),
      unit: "Hari bulan ini",
      icon: <FileText size={24} />,
    },
    {
      title: "Sakit",
      value: count("Sakit"),
      unit: "Hari bulan ini",
      icon: <Stethoscope size={24} />,
    },
    {
      title: "Alpha",
      value: count("Alpha"),
      unit: "Hari bulan ini",
      icon: <XCircle size={24} />,
    },
  ];

  const handleAttendance = async () => {
    // Jika tidak ada dukungan Geolocation di browser
    if (!navigator.geolocation) {
      setErrorAttendance("Browser perangkat Anda tidak mendukung fitur Geolocation.");
      setShowError(true);
      return;
    }

    setLocating(true);
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocating(false);

        try {
          const response = await api.post("siswa/attendance/check-in", {
            latitude,
            longitude,
          });
          setSuccess(response.data.message);
          setShowSuccess(true);
          fetchSession();
        } catch (err) {
          const responseData = err.response?.data;
          if (responseData?.errors) {
            setErrorAttendance(responseData?.errors);
          } else if (responseData?.message) {
            setErrorAttendance(responseData.message);
          } else {
            setErrorAttendance("Gagal melakukan absensi. Silakan coba lagi.");
            console.error("Error check-in:", err);
          }
          setShowError(true);
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setLocating(false);
        setLoading(false);
        console.error("Geolocation error:", geoErr);
        let msg = "Akses lokasi diperlukan untuk melakukan absensi.";
        if (geoErr.code === 1) {
          msg = "Izin lokasi (GPS) ditolak. Silakan izinkan akses lokasi di browser untuk check-in.";
        } else if (geoErr.code === 2) {
          msg = "Posisi perangkat tidak dapat dideteksi. Pastikan GPS aktif.";
        } else if (geoErr.code === 3) {
          msg = "Waktu permintaan lokasi habis (timeout). Silakan coba lagi.";
        }
        setErrorAttendance(msg);
        setShowError(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5 MB");
      return;
    }

    setAttachment(file);
    if (file.type.startsWith("image/")) {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview("pdf");
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  // api kirim pengajuan izin/sakit
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("requestType", form.requestType);
      formData.append("reason", form.reason);
      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await api.post("/siswa/attendance/leave", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess(response.data.message);

      setForm({ requestType: "", reason: "" });
      removeAttachment();
      setShowModal(false);
      setShowSuccess(true);

      fetchSession();
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.errors) {
        setError(responseData?.errors);
      } else if (responseData?.message) {
        setError(responseData.message);
      } else {
        setError("Terjadi kesalahan pada server.");
        console.log(err);
      }
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-[#4F7942]/20 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#4F7942]">AbsensiKu</h1>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#4F7942]">
              Selamat Datang, {user?.name || "Unknown"}!
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Berikut adalah ringkasan kehadiran kamu pada sistem AbsensiKu.
            </p>
          </div>
          {loading ? (
            <div className="flex items-center">
              <div className="w-6 h-6 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              disabled={!!attendedAt}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#4F7942] text-[#4F7942] text-sm font-semibold transition w-fit disabled:cursor-not-allowed ${attendedAt ? "bg-gray-300 text-white border-gray-200" : "hover:bg-[#4F7942]/10"}`}
            >
              <FileText size={18} /> {attendedAt ? "Sudah Absen" : "Ajukan Izin/Sakit"}
            </button>
          )}
        </div>

        <div className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#4F7942]/10 text-[#4F7942] flex items-center justify-center shrink-0">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{formatDate(now)}</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {now.toLocaleTimeString("id-ID")}
              </h3>
              <p
                className={`text-sm font-medium mt-1 ${
                  attendedAt ? "text-[#4F7942]" : "text-amber-600"
                }`}
              >
                {attendedAt
                  ? `Sudah absen pukul ${formatTime(attendedAt)}`
                  : "Kamu belum absen hari ini"}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#4F7942] font-semibold">
              <div className="w-5 h-5 border-3 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
              <span>{locating ? "Mengecek Posisi GPS..." : "Memproses..."}</span>
            </div>
          ) : (
            <button
              onClick={handleAttendance}
              disabled={!!attendedAt}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#4F7942] text-white font-semibold shadow-sm hover:bg-[#3e6034] transition disabled:bg-gray-300 disabled:cursor-not-allowed ${attendedAt ? "bg-gray-200" : ""}`}
            >
              <CheckCircle2 size={20} />
              {attendedAt ? "Sudah Absen" : "Absen Sekarang"}
            </button>
          )}
        </div>

        {/* Info Lokasi Absensi Yang Tersedia */}
        {activeLocations.length > 0 && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Lokasi Check-in yang diizinkan:</strong>{" "}
                {activeLocations.map((l) => `${l.name} (Radius ${l.radius}m)`).join(", ")}
              </span>
            </div>
            <span className="text-emerald-700 font-medium">GPS Aktif Diperlukan</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-150 flex items-start justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {item.title}
                </p>
                {loading ? (
                  <div className="pt-3 flex items-center">
                    <div className="w-6 h-6 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                    {item.value}
                  </h3>
                )}
                <p className="text-xs text-[#4F7942] font-medium mt-1">
                  {item.unit}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#4F7942]/10 text-[#4F7942] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#4F7942]/20 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-[#4F7942]">
                Riwayat Absensi Saya
              </h3>
              <p className="text-sm text-gray-500">
                Menampilkan {history.length} catatan absensi terakhir
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#4F7942] text-white w-fit">
              Total: {history.length} Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#4F7942]/5 text-gray-700 text-xs uppercase tracking-wider border-b border-[#4F7942]/10">
                  <th className="py-3.5 px-6 font-semibold">No</th>
                  <th className="py-3.5 px-6 font-semibold">Tanggal</th>
                  <th className="py-3.5 px-6 font-semibold">Jam</th>
                  <th className="py-3.5 px-6 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-500 font-medium"
                    >
                      Belum ada data absensi
                    </td>
                  </tr>
                ) : (
                  history.map((item, idx) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50/80 transition duration-100"
                    >
                      <td className="py-4 px-6 font-medium text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-800">
                        {formatDate(item.tanggalLokal)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{item.jam}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {item.reason || "Tidak ada"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <div
        className={`fixed left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-white border border-slate-100 shadow-xl rounded-xl p-4 min-w-[320px] max-w-[400px] transition-all duration-500 ease-out
    ${showSuccess ? "top-8 opacity-100 scale-100" : "-top-20 opacity-0 scale-95"}`}
      >
        {/* Aksen Garis Hijau di Sisi Kiri */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-xl" />

        {/* Ikon Sukses dari Lucide React */}
        <div className="text-emerald-500 mt-0.5 ml-1 flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
        </div>

        {/* Teks Notifikasi */}
        <div className="flex-1 pr-2">
          <p className="text-sm font-semibold text-slate-900">Berhasil!</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {success}
          </p>
        </div>
      </div>

      <div
        className={`fixed left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-white border border-slate-100 shadow-xl rounded-xl p-4 min-w-[320px] max-w-[400px] transition-all duration-500 ease-out
    ${showError ? "top-8 opacity-100 scale-100" : "-top-20 opacity-0 scale-95"}`}
      >
        {/* Aksen Garis Merah di Sisi Kiri */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 rounded-l-xl" />

        {/* Ikon Sukses dari Lucide React */}
        <div className="text-red-500 mt-0.5 ml-1 flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
        </div>

        {/* Teks Notifikasi */}
        <div className="flex-1 pr-2">
          <p className="text-sm font-semibold text-slate-900">Gagal!</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {errorAttendance}
          </p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmitLeave}
            className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#4F7942]">
                Ajukan Izin/Sakit
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Jenis</label>
              <select
                id="requestType"
                name="requestType"
                value={form.requestType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]"
              >
                <option value="" disabled>
                  -- Pilih Jenis --
                </option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Alasan
              </label>
              <textarea
                id="reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={3}
                placeholder="Tuliskan alasan kamu..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]"
              />
            </div>

            {/* Upload Bukti Surat Dokter / Orang Tua */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>Bukti Surat Dokter / Orang Tua</span>
                <span className="text-xs text-gray-400 font-normal">Foto atau PDF (Maks 5MB)</span>
              </label>

              {!attachment ? (
                <label className="border-2 border-dashed border-gray-300 hover:border-[#4F7942] rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50/60 hover:bg-emerald-50/30 transition">
                  <UploadCloud className="w-6 h-6 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">
                    Klik untuk pilih dokumen surat
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Mendukung JPG, PNG, PDF
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {attachmentPreview === "pdf" ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                        PDF
                      </div>
                    ) : (
                      <img
                        src={attachmentPreview}
                        alt="Preview"
                        className="w-8 h-8 object-cover rounded-lg border border-emerald-300 shrink-0"
                      />
                    )}
                    <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">
                      {attachment.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Hapus file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <span className="text-red-600 text-xs font-semibold">{error}</span>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingLeave}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F7942] text-white text-sm font-semibold hover:bg-[#3e6034] transition disabled:opacity-50"
              >
                <Send size={16} /> {submittingLeave ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Student;
