import { useAuth } from "../../context/AuthContext";

function Student() {
  const { logout } = useAuth();
  return (
    <>
      <h1>Halo Siswa</h1>
      <button className="bg-red-600 text-white p-2 rounded-md" onClick={logout}>
        Logout
      </button>
    </>
  );
}

export default Student;
