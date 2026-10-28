import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/NavbarAdmin";
import Sidebar from "../components/SidebarAdmin";

function LayoutAdmin() {
  const { user } = useAuth();
  const [mobileResponsive, setMobileResponsive] = useState(false);

  const toggleSidebar = () => setMobileResponsive(!mobileResponsive);
  const closer = () => setMobileResponsive(false);

  return (
    <div onClick={closer} className="min-h-screen bg-gray-50 flex">
      <Sidebar
        mobileResponsive={mobileResponsive}
        setMobileResponsive={setMobileResponsive}
      />

      <div className="pl-0 lg:pl-64 pt-14 flex-1 flex flex-col min-w-0">
        <Navbar user={user} toggleSidebar={toggleSidebar} />

        <main className="p-8 space-y-8">
          {/* Halaman admin (Admin.jsx, ClassAdmin.jsx, dll) dirender di sini */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutAdmin;
