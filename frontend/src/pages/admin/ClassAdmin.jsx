import { useState, useEffect } from "react";
import { Building2, Pencil, Trash2, Plus, Save, X, Search } from "lucide-react";
import api from "../../api/axios";

function ClassAdmin() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const filteredClasses = classes.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/all-class");
      setClasses(res.data.data);
    } catch (err) {
      console.error("Gagal ambil data kelas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const resetForm = () => {
    setForm({ name: "" });
    setEditId(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await api.put(`/admin/update-class/${editId}`, form);
      } else {
        await api.post("/admin/create-class", form);
      }

      resetForm();
      await fetchClasses();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Gagal menyimpan kelas, silakan coba lagi.",
      );
    }
    fetchClasses();
  };

  const handleEdit = (item) => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setForm({ name: item.name });
    setEditId(item._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus kelas ini?")) return;

    try {
      await api.delete(`/admin/delete-class/${id}`);
      await fetchClasses();
    } catch (err) {
      console.error("Gagal menghapus kelas:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#4F7942]/10 text-[#4F7942] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#4F7942]">
              {editId ? "Edit Kelas" : "Tambah Kelas"}
            </h2>
            <p className="text-sm text-gray-500">
              Kelola data kelas pada sistem AbsensiKu.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="className"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Nama Kelas
            </label>
            <input
              id="className"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Contoh: XII RPL 1"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F7942] text-white text-sm font-semibold hover:bg-[#3f6235] transition cursor-pointer"
            >
              {editId ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editId ? "Simpan" : "Tambah"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
            )}
          </div>
        </form>

        <span className="text-red-600 pt-4 text-xs font-semibold">{error}</span>
      </div>

      <div className="bg-white border border-[#4F7942]/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#4F7942]">Daftar Kelas</h3>
            <p className="text-sm text-gray-500">
              Menampilkan seluruh data kelas yang terdaftar
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama kelas..."
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]"
              />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#4F7942] text-white w-fit">
              Total: {filteredClasses.length} Kelas
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4F7942]/5 text-gray-700 text-xs uppercase tracking-wider border-b border-[#4F7942]/10">
                <th className="py-3.5 px-6 font-semibold w-16">No</th>
                <th className="py-3.5 px-6 font-semibold">Nama Kelas</th>
                <th className="py-3.5 px-6 font-semibold text-center w-32">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-gray-500 font-medium"
                  >
                    {search ? "Kelas tidak ditemukan" : "Belum ada data kelas"}
                  </td>
                </tr>
              ) : (
                filteredClasses.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50/80 transition duration-100"
                  >
                    <td className="py-4 px-6 font-medium text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800">
                      {item.name}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          title="Edit"
                          className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Hapus"
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
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
    </div>
  );
}

export default ClassAdmin;
