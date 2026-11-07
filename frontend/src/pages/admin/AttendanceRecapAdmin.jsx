import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Users,
} from "lucide-react";
import api from "../../api/axios";

function AttendanceRecapAdmin() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalData, setTotalData] = useState(0);

  // Filter form
  const [filterType, setFilterType] = useState("all"); // 'all', 'single', 'range'
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Ambil daftar kelas untuk dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/admin/all-class");
        setClasses(res.data?.data || []);
      } catch (err) {
        console.error("Gagal mengambil data kelas:", err);
      }
    };
    fetchClasses();
  }, []);

  const buildQuery = (overridePage = page, isExport = false) => {
    const params = new URLSearchParams();

    if (isExport) {
      params.append("isExport", "true");
    } else {
      params.append("page", overridePage);
      params.append("limit", 15);
    }

    if (classId) params.append("classId", classId);
    if (status) params.append("status", status);

    if (filterType === "single" && date) {
      params.append("date", date);
    } else if (filterType === "range") {
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }
    }

    return params.toString();
  };

  const fetchRecords = async (overridePage = 1) => {
    setLoading(true);
    try {
      const q = buildQuery(overridePage, false);
      const res = await api.get(`/admin/attendance/recap?${q}`);
      setRecords(res.data?.data?.data || []);
      setTotalData(res.data?.data?.pagination?.totalData || 0);
      setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      setPage(overridePage);
    } catch (err) {
      console.error("Gagal mengambil data absensi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [filterType, classId, status]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchRecords(1);
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "Hadir":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Telat":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Izin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Sakit":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Alpha":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  };

  const formatJamIndo = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  // Export ke file CSV (Kompatibel dengan Microsoft Excel)
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const q = buildQuery(1, true);
      const res = await api.get(`/admin/attendance/recap?${q}`);
      const dataToExport = res.data?.data?.data || [];

      if (dataToExport.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const headers = [
        "No",
        "Nama Siswa",
        "NIS",
        "Kelas",
        "Tanggal",
        "Waktu Absen",
        "Status",
        "Keterangan / Alasan",
      ];

      const rows = dataToExport.map((row, idx) => {
        const student = row.studentId || {};
        const user = student.userId || {};
        const kelas = student.classId || {};
        const session = row.sessionId || {};

        return [
          idx + 1,
          `"${(user.name || "-").replace(/"/g, '""')}"`,
          `'${student.nis || "-"}`,
          `"${(kelas.name || "-").replace(/"/g, '""')}"`,
          formatTanggalIndo(session.date || row.createdAt),
          row.checkInTime ? formatJamIndo(row.checkInTime) : "-",
          row.status || "-",
          `"${(row.reason || "-").replace(/"/g, '""')}"`,
        ];
      });

      const csvContent =
        "\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Rekap_Absensi_${new Date().toISOString().slice(0, 10)}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal export CSV:", err);
      alert("Gagal mengunduh file rekap");
    } finally {
      setExporting(false);
    }
  };

  // Print / PDF Laporan via Puppeteer Backend
  const handlePrint = async () => {
    setExporting(true);
    try {
      const q = buildQuery(1, true);
      const res = await api.get(`/admin/attendance/recap/pdf?${q}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const safeDate = new Date().toISOString().slice(0, 10);
      const filename = `Laporan_Absensi_${safeDate}.pdf`;
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Gagal mengunduh PDF laporan:", err);
      alert("Gagal memproses cetak PDF. Pastikan data tersedia dan server aktif.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Rekap & Export Laporan Absensi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lihat riwayat data absensi siswa dan unduh laporan resmi dalam format Excel (CSV) atau cetak ke PDF.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? "Mengunduh..." : "Export Excel (CSV)"}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <form
        onSubmit={handleApplyFilter}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4"
      >
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-[#4F7942]" />
          <span>Filter Laporan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tipe Filter Waktu */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
              Rentang Waktu
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30"
            >
              <option value="all">Semua Waktu</option>
              <option value="single">Per Tanggal Spesifik</option>
              <option value="range">Rentang Tanggal (Mulai - Sampai)</option>
            </select>
          </div>

          {/* Filter Tanggal Dinamis */}
          {filterType === "single" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                Pilih Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30"
              />
            </div>
          )}

          {filterType === "range" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30"
                />
              </div>
            </>
          )}

          {/* Filter Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
              Filter Kelas
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
              Status Absensi
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/30"
            >
              <option value="">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Telat">Telat</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Alpha">Alpha</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#4F7942] hover:bg-[#436737] text-white text-xs font-semibold transition cursor-pointer"
          >
            Terapkan Filter
          </button>
        </div>
      </form>

      {/* Tabel Data Rekap */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#4F7942]" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Data Rekapitulasi ({totalData} Total Data)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5 font-semibold w-14">No</th>
                <th className="py-3 px-5 font-semibold">Nama Siswa</th>
                <th className="py-3 px-5 font-semibold">NIS</th>
                <th className="py-3 px-5 font-semibold">Kelas</th>
                <th className="py-3 px-5 font-semibold">Tanggal</th>
                <th className="py-3 px-5 font-semibold">Waktu Absen</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Clock className="w-5 h-5 animate-spin text-[#4F7942]" />
                      <span>Memuat data absensi...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-slate-400 text-sm font-medium"
                  >
                    Tidak ada catatan absensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                records.map((item, idx) => {
                  const student = item.studentId || {};
                  const user = student.userId || {};
                  const kelas = student.classId || {};
                  const session = item.sessionId || {};

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3.5 px-5 text-slate-400 font-medium">
                        {(page - 1) * 15 + idx + 1}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {user.name || "-"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {student.nis || "-"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {kelas.name || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {formatTanggalIndo(session.date || item.createdAt)}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {item.checkInTime ? formatJamIndo(item.checkInTime) : "-"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs max-w-xs truncate">
                        {item.reason || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Halaman <span className="font-semibold text-slate-800">{page}</span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRecords(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => fetchRecords(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-xs font-medium bg-[#4F7942] text-white rounded-lg hover:bg-[#436737] disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceRecapAdmin;
