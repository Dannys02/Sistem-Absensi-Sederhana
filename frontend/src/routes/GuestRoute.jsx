import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

function GuestRoute({ children }) {
  const { token, user, loading } = useAuth();

  if (loading) return <Loading />;

  if (token && user) {
    if (user.role === "siswa") {
      return <Navigate to="/dashboard/siswa" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/dashboard/admin" replace />;
    }
  }

  return children;
}

export default GuestRoute;
