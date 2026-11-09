import { useState, useEffect } from "react";
import { Users, Pencil, Trash2, Plus, Save, X, Search } from "lucide-react";
import api from "../../api/axios";

const emptyForm = { name: "", email: "", password: "", classId: "", nis: "", phone: "", parentPhone: "" };

function StudentAdmin() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState({});

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  // efek debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError({});
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStudent, resClass] = await Promise.all([
        api.get(
          `/admin/all-student?search=${debouncedSearch}&page=${page}&limit=10`,
        ),
        api.get("/admin/all-class"),
      ]);
      setStudents(resStudent.data.data.data.students);
      setTotalPage(resStudent.data.data.pagination.totalPage);
      setClasses(resClass.data.data);
    } catch (err) {
      console.error("Gagal ambil data siswa:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, page]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.classId || !form.nis.trim()) return;

    try {
      if (editId) {
        // buat salinan data dari form
        const payload = { ...form };

        // jika password kosong saat edit, hapus dari data yang akan dikirim ke backend
        if (!payload.password || payload.password.trim() === "") {
          delete payload.password;
        }

        // kirim data yang sudah bersih tanpa password kosong
        await api.put(`/admin/update-student/${editId}`, payload);
      } else {
        await api.post("/admin/create-student", form);
      }
      resetForm();
      setEditId(null);
      await fetchData();
    } catch (err) {
      const responseData = err.response?.data;

      if (responseData?.errors) {
        // jika error datang dari validasi Joi
        setError(responseData.errors);
      } else if (responseData?.message) {
        // jika error datang dari Controller
        const msg = responseData.message;

        // petakan pesan error ke field yang sesuai agar muncul di bawah input-nya
        if (msg.includes("email")) {
          setError({ email: responseData.message });
        } else if (msg.includes("nis")) {
          setError({ nis: responseData.message });
        } else if (msg.includes("kelas")) {
          setError({ classId: responseData.message });
        } else {
          // Fallback untuk error umum lainnya
          alert(responseData.message);
        }
      } else {
        // Fallback jika tidak ada response sama sekali dari server
        alert("Terjadi kesalahan pada server.");
      }
    }
    fetchData();
  };

  const handleEdit = (item) => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setEditId(item.userId?._id);
    setForm({
      name: item.userId?.name || "",
      email: item.userId?.email || "",
      password: "",
      classId: item.classId?._id || "",
      nis: item.nis || "",
      phone: item.phone || "",
      parentPhone: item.parentPhone || "",
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return;
    try {
      await api.delete(`/admin/delete-student/${id}`);
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Gagal menyimpan data siswa",
        err,
      );
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]";

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#4F7942]/10 text-[#4F7942] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#4F7942]">
              {editId ? "Edit Siswa" : "Tambah Siswa"}
            </h2>
            <p className="text-sm text-gray-500">
              Kelola data siswa pada sistem AbsensiKu.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Nama Siswa
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                autoComplete="name" 
                onChange={handleChange}
                placeholder="Dannys Martha"
                className={inputClass}
              />
              {error.name && (
                <span className="text-red-600 pt-4 text-xs font-semibold lowercase">
                  {error.name}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                autoComplete="email" 
                onChange={handleChange}
                placeholder="anda@gmail.com"
                className={inputClass}
              />
              {error.email && (
                <span className="text-red-600 pt-4 text-xs font-semibold lowercase">
                  {error.email}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password ?? ""}
                autoComplete="new-password"
                onChange={handleChange}
                placeholder="password"
                className={inputClass}
              />
              {error.password && (
                <span className="text-red-600 pt-4 text-xs font-semibold lowercase">
                  {error.password}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="nis"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                NIS
              </label>
              <input
                id="nis"
                name="nis"
                type="text"
                value={form.nis}
                autoComplete="off"
                onChange={handleChange}
                placeholder="Contoh: 12345"
                className={inputClass}
              />
              {error.nis && (
                <span className="text-red-600 pt-4 text-xs font-semibold lowercase">
                  {error.nis}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="classId"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Kelas
              </label>
              <select
                id="classId"
                name="classId"
                value={form.classId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {error.classId && (
                <span className="text-red-600 pt-4 text-xs font-semibold lowercase">
                  {error.classId}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                No. WhatsApp Siswa
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={form.phone}
                autoComplete="tel"
                onChange={handleChange}
                placeholder="081234567890"
                className={inputClass}
              />
              <span className="text-gray-400 text-xs">
                Untuk pengingat absensi & info izin
              </span>
            </div>
            <div>
              <label
                htmlFor="parentPhone"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                No. WhatsApp Orang Tua / Wali
              </label>
              <input
                id="parentPhone"
                name="parentPhone"
                type="text"
                value={form.parentPhone}
                autoComplete="tel"
                onChange={handleChange}
                placeholder="081987654321"
                className={inputClass}
              />
              <span className="text-gray-400 text-xs">
                Opsional untuk notifikasi wali murid
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4 w-fit">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F7942] text-white text-sm font-semibold hover:bg-[#3f6235] transition cursor-pointer"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white border border-[#4F7942]/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#4F7942]">Daftar Siswa</h3>
            <p className="text-sm text-gray-500">
              Menampilkan seluruh data siswa yang terdaftar
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search"
                name="search"
                type="search"
                value={search}
                autoComplete="off"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, NIS, kelas..."
                className="w-full sm:w-72 pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]"
              />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#4F7942] text-white w-fit">
              Total: {students.length} Siswa
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4F7942]/5 text-gray-700 text-xs uppercase tracking-wider border-b border-[#4F7942]/10">
                <th className="py-3.5 px-6 font-semibold w-16">No</th>
                <th className="py-3.5 px-6 font-semibold">Nama Siswa</th>
                <th className="py-3.5 px-6 font-semibold">Email</th>
                <th className="py-3.5 px-6 font-semibold">WhatsApp</th>
                <th className="py-3.5 px-6 font-semibold">NIS</th>
                <th className="py-3.5 px-6 font-semibold">Kelas</th>
                <th className="py-3.5 px-6 font-semibold text-center w-32">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-gray-500 font-medium"
                  >
                    {search ? "Siswa tidak ditemukan" : "Belum ada data siswa"}
                  </td>
                </tr>
              ) : (
                students.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50/80 transition duration-100"
                  >
                    <td className="py-4 px-6 font-medium text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800">
                      {item.userId?.name}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800">
                      {item.userId?.email}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600 font-mono">
                      {item.phone || "-"}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{item.nis}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        {item.classId?.name || "-"}
                      </span>
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
                          onClick={() => handleDelete(item.userId?._id)}
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Halaman <span className="font-semibold text-gray-800">{page}</span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-800">{totalPage}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => prev - 1)}
              disabled={page === 1 || loading}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= totalPage || loading}
              className="px-4 py-2 text-sm font-medium bg-[#4F7942] text-white rounded-lg hover:bg-[#3f6235] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentAdmin;
