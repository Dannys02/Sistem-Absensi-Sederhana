import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  House,
  Building2,
  Users,
  ClipboardCheck,
  Sliders,
  FileSpreadsheet,
} from "lucide-react";

function Sidebar({ mobileResponsive }) {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      onClick={(e) => e.stopPropagation()}
      className={`fixed w-64 z-[999] min-h-screen bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileResponsive ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-full bg-[#4F7942] flex items-center justify-center text-white shadow-sm">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide text-white">
              AbsensiKu
            </h2>
            <p className="text-[11px] text-slate-400 -mt-1">Panel Admin</p>
          </div>
        </div>

        <div className="p-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Menu Utama
          </p>
          <nav className="space-y-1.5">
            <Link
              to="/dashboard/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive("/dashboard/admin")
                  ? "bg-[#4F7942] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <House className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/class/management"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive("/class/management")
                  ? "bg-[#4F7942] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>Manajemen Kelas</span>
            </Link>

            <Link
              to="/student/management"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive("/student/management")
                  ? "bg-[#4F7942] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Manajemen Siswa</span>
            </Link>

            <Link
              to="/student/leave"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive("/student/leave")
                  ? "bg-[#4F7942] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <ClipboardCheck className="w-5 h-5" />
              <span>Izin / Sakit</span>
            </Link>

            <Link
              to="/attendance/recap"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive("/attendance/recap")
                  ? "bg-[#4F7942] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Rekap Absensi</span>
            </Link>

            <Link
              to="/attendance/settings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive("/attendance/settings")
                  ? "bg-[#4F7942] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Sliders className="w-5 h-5" />
              <span>Otomasi Sesi</span>
            </Link>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition duration-150 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
