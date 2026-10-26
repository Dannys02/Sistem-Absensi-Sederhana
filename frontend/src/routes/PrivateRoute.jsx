import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading)
    return <Loading />;

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) return <Navigate to="/login" />;

  return children;
}

export default PrivateRoute;
