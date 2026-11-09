import { useState, useEffect } from "react";
import { FileText, Check, X, Search, Paperclip, ExternalLink, Image } from "lucide-react";
import api from "../../api/axios";

function StudentLeave() {
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [previewFile, setPreviewFile] = useState(null); // URL file untuk modal preview

  const getFileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");
    return `${baseUrl}${path}`;
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/attendance/leave");
      setLeaves(res.data.data);
    } catch (err) {
      console.error("Gagal ambil data pengajuan izin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // aksi = "approve" | "reject"
  const handleAction = async (id, action) => {
    const label = action === "approve" ? "menerima" : "menolak";
    if (!confirm(`Yakin ingin ${label} pengajuan ini?`)) return;

    setProcessingId(id);
    try {
      const res = await api.put(`/admin/attendance/leave/${action}/${id}`);
      // hapus dari list karena sudah tidak berstatus "Menunggu Approval"
      setLeaves((prev) => prev.filter((l) => l._id !== id));
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Gagal memproses pengajuan",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getTypeBadge = (type) =>
    type === "Sakit"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  const keyword = search.toLowerCase();
  const filteredLeaves = leaves.filter((l) =>
    [
      l.studentId?.userId?.name,
      l.studentId?.nis,
      l.studentId?.classId?.name,
      l.requestType,
      l.reason,
    ].some((v) => String(v ?? "").toLowerCase().includes(keyword)),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#4F7942]/10 text-[#4F7942] flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#4F7942]">
            Manajemen Izin / Sakit
          </h2>
          <p className="text-sm text-gray-500">
            Terima atau tolak pengajuan izin dan sakit dari siswa.
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between ${
            message.type === "success"
              ? "bg-[#4F7942]/10 text-[#4F7942] border-[#4F7942]/30"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white border border-[#4F7942]/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#4F7942]">
              Daftar Pengajuan
            </h3>
            <p className="text-sm text-gray-500">
              Menampilkan pengajuan yang masih menunggu persetujuan
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search"
                name="search"
                type="text"
                value={search}
                autoComplete="off"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIS, kelas..."
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]"
              />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#4F7942] text-white w-fit">
              Pending: {filteredLeaves.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4F7942]/5 text-gray-700 text-xs uppercase tracking-wider border-b border-[#4F7942]/10">
                <th className="py-3.5 px-6 font-semibold w-16">No</th>
                <th className="py-3.5 px-6 font-semibold">Nama Siswa</th>
                <th className="py-3.5 px-6 font-semibold">NIS</th>
                <th className="py-3.5 px-6 font-semibold">Kelas</th>
                <th className="py-3.5 px-6 font-semibold">Jenis</th>
                <th className="py-3.5 px-6 font-semibold">Alasan</th>
                <th className="py-3.5 px-6 font-semibold text-center">Bukti Surat</th>
                <th className="py-3.5 px-6 font-semibold">Diajukan</th>
                <th className="py-3.5 px-6 font-semibold text-center w-40">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-gray-500 font-medium"
                  >
                    {search
                      ? "Pengajuan tidak ditemukan"
                      : "Tidak ada pengajuan izin/sakit yang menunggu persetujuan"}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50/80 transition duration-100"
                  >
                    <td className="py-4 px-6 font-medium text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800">
                      {item.studentId?.userId?.name || "-"}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {item.studentId?.nis || "-"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        {item.studentId?.classId?.name || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${getTypeBadge(item.requestType)}`}
                      >
                        {item.requestType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 max-w-xs">
                      {item.reason || "-"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.attachment ? (
                        <button
                          type="button"
                          onClick={() => setPreviewFile(getFileUrl(item.attachment))}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Lihat Surat</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Tanpa Berkas</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAction(item._id, "approve")}
                          disabled={processingId === item._id}
                          title="Terima"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4F7942]/10 text-[#4F7942] text-xs font-semibold hover:bg-[#4F7942]/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" />
                          Terima
                        </button>
                        <button
                          onClick={() => handleAction(item._id, "reject")}
                          disabled={processingId === item._id}
                          title="Tolak"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Preview Berkas */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4F7942]" />
                <span>Bukti Surat Izin / Sakit Siswa</span>
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1 transition"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2 min-h-[300px]">
              {previewFile.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewFile}
                  title="Pratinjau PDF"
                  className="w-full h-[500px] rounded-lg border border-slate-200"
                />
              ) : (
                <img
                  src={previewFile}
                  alt="Bukti Surat Izin"
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-xs"
                />
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentLeave;
