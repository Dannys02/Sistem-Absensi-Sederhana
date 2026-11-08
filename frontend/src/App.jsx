import "./App.css";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import GuestRoute from "./routes/GuestRoute";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

import Admin from "./pages/dashboard/Admin";
import LayoutAdmin from "./layouts/LayoutAdmin";
import ClassAdmin from "./pages/admin/ClassAdmin";
import StudentAdmin from "./pages/admin/StudentAdmin";
import StudentLeave from "./pages/admin/StudentLeave";
import AttendanceRecapAdmin from "./pages/admin/AttendanceRecapAdmin";
import AttendanceSettingAdmin from "./pages/admin/AttendanceSettingAdmin";
import LocationAdmin from "./pages/admin/LocationAdmin";
import Student from "./pages/dashboard/Student";
import { Routes, Route } from "react-router-dom";

function App() {
  const ScrollTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
    return null;
  };

  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          element={
            <PrivateRoute role="admin">
              <LayoutAdmin />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard/admin" element={<Admin />} />
          <Route path="/class/management" element={<ClassAdmin />} />
          <Route path="/student/management" element={<StudentAdmin />} />
          <Route path="/student/leave" element={<StudentLeave />} />
          <Route path="/location/management" element={<LocationAdmin />} />
          <Route path="/attendance/recap" element={<AttendanceRecapAdmin />} />
          <Route path="/attendance/settings" element={<AttendanceSettingAdmin />} />
        </Route>

        <Route
          path="/dashboard/siswa"
          element={
            <PrivateRoute role="siswa">
              <Student />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
