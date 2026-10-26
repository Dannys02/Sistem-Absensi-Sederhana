import { useState } from "react";
import "./App.css";
import PrivateRoute from "./routes/PrivateRoute";
import GuestRoute from "./routes/GuestRoute";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

import Admin from "./pages/dashboard/Admin";
import Student from "./pages/dashboard/Student";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
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
        path="/dashboard/admin"
        element={
          <PrivateRoute role="admin">
            <Admin />
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard/siswa"
        element={
          <PrivateRoute role="siswa">
            <Student />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
