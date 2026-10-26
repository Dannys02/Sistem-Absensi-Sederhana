import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// Buat context kosong sebagai wadah global state
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // data user yang login
  const [token, setToken] = useState(localStorage.getItem('token')); // token dari localStorage
  const [loading, setLoading] = useState(true); // loading saat cek session

  // Saat app pertama dibuka, cek apakah token masih valid
  useEffect(() => {
    if (token) {
      api.get('/me')
        .then((res) => setUser(res.data.data))
        .catch(() => logout()) // token invalid, paksa logout
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Simpan token ke localStorage dan state
  function login(userData, userToken) {
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(userData);
  }

  // Hapus token dan reset state
  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    // Semua komponen di dalam AuthProvider bisa akses user, login, logout
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook supaya mudah dipanggil: const { user } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}