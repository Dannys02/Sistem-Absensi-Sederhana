import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import api from "../../api/axios";

const DAYS = [
  { id: 1, label: "Senin" },
  { id: 2, label: "Selasa" },
  { id: 3, label: "Rabu" },
  { id: 4, label: "Kamis" },
  { id: 5, label: "Jumat" },
  { id: 6, label: "Sabtu" },
  { id: 0, label: "Minggu" },
];

function AttendanceSettingAdmin() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    startTime: "06:00",
    lateThreshold: "06:30",
    endTime: "07:00",
    activeDays: [1, 2, 3, 4, 5],
    isAutomated: true,
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/attendance-settings");
      if (res.data?.data) {
        setForm({
          startTime: res.data.data.startTime || "06:00",
          lateThreshold: res.data.data.lateThreshold || "06:30",
          endTime: res.data.data.endTime || "07:00",
          activeDays: Array.isArray(res.data.data.activeDays)
            ? res.data.data.activeDays
            : [1, 2, 3, 4, 5],
          isAutomated:
            typeof res.data.data.isAutomated === "boolean"
              ? res.data.data.isAutomated
              : true,
        });
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan sesi:", err);
      showFeedback("error", "Gagal memuat konfigurasi absensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleDayToggle = (dayId) => {
    setForm((prev) => {
      const exists = prev.activeDays.includes(dayId);
      const newDays = exists
        ? prev.activeDays.filter((d) => d !== dayId)
        : [...prev.activeDays, dayId];
      return { ...prev, activeDays: newDays.sort((a, b) => a - b) };
    });
  };

  const handleSelectPreset = (type) => {
    if (type === "workdays") {
      setForm((prev) => ({ ...prev, activeDays: [1, 2, 3, 4, 5] }));
    } else if (type === "all") {
      setForm((prev) => ({ ...prev, activeDays: [0, 1, 2, 3, 4, 5, 6] }));
    } else if (type === "clear") {
      setForm((prev) => ({ ...prev, activeDays: [] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !(form.startTime < form.lateThreshold && form.lateThreshold < form.endTime)
    ) {
      showFeedback(
        "error",
        "Urutan jam tidak valid! Harus: Jam Mulai < Batas Terlambat < Jam Selesai",
      );
      return;
    }

    if (form.isAutomated && form.activeDays.length === 0) {
      showFeedback(
        "error",
        "Pilih minimal satu hari aktif jika otomasi diaktifkan!",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await api.put("/admin/attendance-settings", form);
      showFeedback("success", res.data?.message || "Pengaturan berhasil disimpan");
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menyimpan perubahan";
      showFeedback("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Manajemen Otomasi Sesi Absensi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Atur jam buka absensi, batas keterlambatan, waktu tutup sesi, serta jadwal hari aktif secara otomatis.
        </p>
      </div>

      {/* Alert Notifikasi */}
      {feedback.message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-500">
          <Clock className="w-6 h-6 animate-spin mr-2 text-[#4F7942]" />
          <span>Memuat pengaturan...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Status Otomasi */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Status Otomasi Sistem
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jika dinonaktifkan, scheduler tidak akan membuat sesi absensi baru pada hari apa pun.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    isAutomated: !prev.isAutomated,
                  }))
                }
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  form.isAutomated
                    ? "bg-[#4F7942]/10 text-[#4F7942] hover:bg-[#4F7942]/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {form.isAutomated ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-[#4F7942]" />
                    <span>Otomasi Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                    <span>Otomasi Nonaktif</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Pengaturan Jam */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-[#4F7942]" />
              <h3 className="text-base font-semibold text-slate-800">
                Waktu Sesi Absensi
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Jam Mulai */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Jam Mulai Masuk
                </label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30 focus:border-[#4F7942]"
                />
                <p className="text-[11px] text-slate-400">
                  Siswa dapat mulai melakukan absensi hadir.
                </p>
              </div>

              {/* Batas Terlambat */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Batas Jam Terlambat
                </label>
                <input
                  type="time"
                  required
                  value={form.lateThreshold}
                  onChange={(e) =>
                    setForm({ ...form, lateThreshold: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30 focus:border-[#4F7942]"
                />
                <p className="text-[11px] text-slate-400">
                  Absen lewat dari waktu ini ditandai Terlambat.
                </p>
              </div>

              {/* Jam Ditutup */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Jam Ditutup (Alpha)
                </label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30 focus:border-[#4F7942]"
                />
                <p className="text-[11px] text-slate-400">
                  Absensi ditutup, siswa yang belum absen ditandai Alpha.
                </p>
              </div>
            </div>

            {/* Info Hint */}
            <div className="mt-5 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Urutan waktu harus valid: <strong>{form.startTime || "--:--"}</strong> (Mulai) &lt; <strong>{form.lateThreshold || "--:--"}</strong> (Terlambat) &lt; <strong>{form.endTime || "--:--"}</strong> (Tutup).
              </span>
            </div>
          </div>

          {/* Card 3: Pilihan Hari Berjalan */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#4F7942]" />
                <h3 className="text-base font-semibold text-slate-800">
                  Jadwal Hari Aktif Otomasi
                </h3>
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset("workdays")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Senin - Jumat (5 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("all")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Setiap Hari (7 Hari)
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Pilih hari apa saja sistem otomatis membuat sesi absensi. Hari yang tidak dicentang (misal: Sabtu & Minggu) tidak akan dibuatkan sesi otomatis.
            </p>

            {/* Day Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {DAYS.map((day) => {
                const isSelected = form.activeDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleDayToggle(day.id)}
                    className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#4F7942]/10 border-[#4F7942] text-[#4F7942] font-semibold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-sm">{day.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-[#4F7942] text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isSelected ? "Aktif" : "Libur"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4F7942] text-white text-sm font-semibold shadow-md hover:bg-[#436737] focus:ring-4 focus:ring-[#4F7942]/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Menyimpan Perubahan..." : "Simpan Pengaturan"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AttendanceSettingAdmin;
