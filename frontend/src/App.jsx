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
