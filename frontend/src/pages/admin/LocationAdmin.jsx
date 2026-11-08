import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Navigation,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Compass,
} from "lucide-react";
import api from "../../api/axios";

export default function LocationAdmin() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: 100,
    address: "",
    isActive: true,
  });

  const [gettingCurrentPos, setGettingCurrentPos] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/locations");
      setLocations(res.data?.data || []);
    } catch (err) {
      console.error("Gagal mengambil data lokasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      latitude: "",
      longitude: "",
      radius: 100,
      address: "",
      isActive: true,
    });
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (loc) => {
    setEditingId(loc._id);
    setFormData({
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.radius || 100,
      address: loc.address || "",
      isActive: loc.isActive,
    });
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation.");
      return;
    }

    setGettingCurrentPos(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setGettingCurrentPos(false);
      },
      (error) => {
        console.error("Gagal mendeteksi lokasi:", error);
        alert(
          "Gagal mengambil lokasi saat ini. Pastikan izin lokasi (GPS) sudah diaktifkan di browser."
        );
        setGettingCurrentPos(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      if (editingId) {
        await api.put(`/admin/locations/${editingId}`, formData);
      } else {
        await api.post("/admin/locations", formData);
      }

      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menyimpan lokasi";
      setFeedback({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/locations/${id}/toggle`);
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengubah status lokasi");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus titik lokasi "${name}"?`)) return;

    try {
      await api.delete(`/admin/locations/${id}`);
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus lokasi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Lokasi Absensi (Geofencing)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur titik koordinat dan radius toleransi area sekolah yang diizinkan untuk check-in siswa.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F7942] hover:bg-[#3d5e33] text-white text-sm font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Titik Lokasi</span>
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <Compass className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-900 leading-relaxed">
          <strong>Bagaimana Geofencing Bekerja:</strong> Siswa hanya bisa melakukan check-in jika berada di dalam salah satu titik lokasi yang berstatus <strong>Aktif</strong>. Jika status lokasi dinonaktifkan, siswa tidak akan bisa absen di titik tersebut.
        </div>
      </div>

      {/* Tabel Lokasi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Lokasi</th>
                <th className="px-6 py-4">Koordinat (Lat, Long)</th>
                <th className="px-6 py-4">Radius Toleransi</th>
                <th className="px-6 py-4">Alamat / Keterangan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    Memuat data lokasi...
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    Belum ada lokasi absensi. Klik tombol <strong>Tambah Titik Lokasi</strong> di atas.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#4F7942]" />
                        <span>{loc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {loc.latitude}, {loc.longitude}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {loc.radius} meter
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">
                      {loc.address || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggle(loc._id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          loc.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Klik untuk ubah status aktif/non-aktif"
                      >
                        {loc.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Bisa Check-In</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Non-Aktif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(loc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Lokasi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(loc._id, loc.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Lokasi"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#4F7942]" />
                <span>{editingId ? "Edit Lokasi Absensi" : "Tambah Lokasi Absensi"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {feedback.message && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lokasi / Gedung *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kampus Utama, Lapangan Upacara, Lab Komputer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]"
                />
              </div>

              {/* Tombol Ambil GPS Saat Ini */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Gunakan GPS Saat Ini</p>
                  <p className="text-[11px] text-slate-500">
                    Otomatis isi Latitude & Longitude dari posisi Anda sekarang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gettingCurrentPos}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#4F7942]" />
                  <span>{gettingCurrentPos ? "Mendeteksi..." : "Ambil Titik"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="-6.200000"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F7942]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="106.816666"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F7942]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Radius Toleransi (Meter) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="5"
                    max="5000"
                    required
                    value={formData.radius}
                    onChange={(e) =>
                      setFormData({ ...formData, radius: Number(e.target.value) })
                    }
                    className="w-32 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F7942]"
                  />
                  <span className="text-xs text-slate-500">
                    Siswa harus berada dalam jarak maksimal ini dari titik pusat.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat / Keterangan Tambahan
                </label>
                <textarea
                  rows="2"
                  placeholder="Misal: Jl. Pendidikan No. 1, Lantai 1 Gedung A"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#4F7942] focus:ring-[#4F7942] cursor-pointer"
                />
                <label
                  htmlFor="isActiveToggle"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Aktifkan lokasi ini agar siswa bisa melakukan check-in
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#4F7942] hover:bg-[#3d5e33] rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan Lokasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
