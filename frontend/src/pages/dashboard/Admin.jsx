import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import {
  Building2,
  Users,
  CheckCircle2,
  Menu,
  User,
  FileText,
  Stethoscope,
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

  const [mobileResponsive, setMobileResponsive] = useState(false);

  // warna badge status absensi
  const getStatusBadge = (status) => {
    switch (status) {
      case "Hadir":
        return "bg-[#4F7942]/15 text-[#4F7942] border-[#4F7942]/30";
      case "Terlambat":
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

  useEffect(() => {
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
          api.get("/admin/all-student"),
          api.get(
            `/admin/attendance/recap?date=${tanggalHariIni}&status=Hadir&status=Telat`,
          ),
          api.get("/admin/attendance/leave"),
          api.get(`/admin/attendance/recap?date=${tanggalHariIni}&status=Izin&status=Sakit`),
          api.get("/admin/student-without-attendance"),
        ]);

        setGrade(resClass.data.data.length);
        setStudent(resStudent.data.data.students.length);
        setAttendanceToday(resAttendance.data.data.pagination.totalData);
        setPermissionStudent(resPermissionStudent.data.data.length);
        setStudentLeave(resStudentLeave.data.data.pagination.totalData);
        setStudentWithoutAttendance(resStudentWithoutAttendance.data.data.data);
      } catch (err) {
        console.error("Gagal ambil data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const toggleSidebar = () => {
    setMobileResponsive(!mobileResponsive);
  };

  const closer = () => {
    setMobileResponsive(false);
  };

  return (
    <div onClick={closer} className="min-h-screen bg-gray-50 flex">
      <Sidebar
        mobileResponsive={mobileResponsive}
        setMobileResponsive={setMobileResponsive}
      />

      <div className="pl-0 lg:pl-64 flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#4F7942]/20 px-8 flex items-center justify-between shadow-xs">
          <div>
            <h1 className="hidden md:block text-lg font-bold text-[#4F7942]">
              Admin Dashboard
            </h1>

            <button
              className="block md:hidden"
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {user?.name || "Uknown"}
              </p>
              <p className="text-xs text-[#4F7942] font-medium capitalize">
                {user?.role || "Uknown"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#4F7942]/10 border border-[#4F7942]/30 text-[#4F7942] flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        <main className="p-8 space-y-8">
          <div className="bg-white border border-[#4F7942]/20 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#4F7942]">
                Selamat Datang, {user?.name || "Uknown"}!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Berikut adalah ringkasan statistik data kelas, siswa, dan
                kehadiran pada sistem AbsensiKu hari ini.
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
                  <p className="text-sm font-medium text-gray-500">
                    {item.title}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                    {item.value}
                  </h3>
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#4F7942] text-white w-fit">
                Total Hari Ini: {studentWithoutAttendance.length} Siswa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#4F7942]/5 text-gray-700 text-xs uppercase tracking-wider border-b border-[#4F7942]/10">
                    <th className="py-3.5 px-6 font-semibold">No</th>
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
                          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : studentWithoutAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 font-medium">
                        Tidak ada data siswa yang belum absen hari ini
                      </td>
                    </tr>
                  ) : (
                    studentWithoutAttendance.map((siswa, idx) => (
                      <tr
                        key={siswa._id}
                        className="hover:bg-gray-50/80 transition duration-100"
                      >
                        <td className="py-4 px-6 font-medium text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-800">
                          {siswa.userId?.name}
                        </td>
                        <td className="py-4 px-6 text-gray-600">{siswa.nis}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                            {siswa.classId?.name}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Admin;
