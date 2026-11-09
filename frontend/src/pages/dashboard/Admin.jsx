import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Building2,
  Users,
  CheckCircle2,
  FileText,
  Stethoscope,
  Search,
} from "lucide-react";
import api from "../../api/axios";

function Admin() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState(0);
  const [student, setStudent] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [permissionStudent, setPermissionStudent] = useState(0);
  const [studentLeave, setStudentLeave] = useState(0);
  const [studentWithoutAttendance, setStudentWithoutAttendance] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  // efek debounce pencarian
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // warna badge status absensi
  const getStatusBadge = (status) => {
    switch (status) {
      case "Hadir":
        return "bg-[#4F7942]/15 text-[#4F7942] border-[#4F7942]/30";
      case "Telat":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Izin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Sakit":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();

    // Menambah angka 0 di depan jika bulan/hari bernilai satuan (1-9)
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // Hasilnya: "2026-10-27"
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const tanggalHariIni = getTodayDateString();
      const [
        resClass,
        resStudent,
        resAttendance,
        resPermissionStudent,
        resStudentLeave,
        resStudentWithoutAttendance,
      ] = await Promise.all([
        api.get("/admin/all-class"),
        api.get(
          `/admin/all-student?search=${debouncedSearch}&page=${page}&limit=10`,
        ),
        api.get(
          `/admin/attendance/recap?date=${tanggalHariIni}&status=Hadir&status=Telat`,
        ),
        api.get("/admin/attendance/leave"),
        api.get(
          `/admin/attendance/recap?date=${tanggalHariIni}&status=Izin&status=Sakit`,
        ),
        api.get(`/admin/student-without-attendance?search=${debouncedSearch}&page=${page}&limit=10`),
      ]);

      setGrade(resClass.data.data.length);
      setStudent(resStudent.data.data.pagination.totalData);
      setAttendanceToday(resAttendance.data.data.pagination.totalData);
      setPermissionStudent(resPermissionStudent.data.data.length);
      setStudentLeave(resStudentLeave.data.data.pagination.totalData);
      setStudentWithoutAttendance(resStudentWithoutAttendance.data.data.data.students);

      setTotalPage(resStudentWithoutAttendance.data.data.pagination.totalPage);
    } catch (err) {
      console.error("Gagal ambil data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, page]);

  // Statistik Cards
  const stats = [
    {
      title: "Total Data Kelas",
      value: grade,
      unit: "Kelas Aktif",
      icon: <Building2 className="w-6 h-6" />,
    },
    {
      title: "Total Data Siswa",
      value: student,
      unit: "Siswa Terdaftar",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Absensi Hari Ini",
      value: attendanceToday,
      unit: "Siswa Sudah Absen",
      icon: <CheckCircle2 className="w-6 h-6" />,
    },
    {
      title: "Pengajuan Izin",
      value: permissionStudent,
      unit: "Pengajuan Izin yang masih pending",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "Siswa Izin/Sakit",
      value: studentLeave,
      unit: "Siswa yang izin / sakit hari ini",
      icon: <Stethoscope className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#4F7942]">
            Selamat Datang, {user?.name || "Uknown"}!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Berikut adalah ringkasan statistik data kelas, siswa, dan kehadiran
            pada sistem AbsensiKu hari ini.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-150 flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">{item.title}</p>
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
              Daftar Siswa yang belum Absen Hari Ini
            </h3>
            <p className="text-sm text-gray-500">
              Menampilkan {studentWithoutAttendance.length} siswa yang telah
              tercatat belum melakukan absensi hari ini
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
              Total Hari Ini: {studentWithoutAttendance.length} Siswa
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : studentWithoutAttendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-500 font-medium"
                  >
                    {search
                      ? "Siswa tidak ditemukan"
                      : "Tidak ada data siswa yang belum absen hari ini"}
                  </td>
                </tr>
              ) : (
                studentWithoutAttendance.map((item, idx) => (
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
                    <td className="py-4 px-6 text-gray-600">{item.nis}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        {item.classId?.name}
                      </span>
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

export default Admin;
