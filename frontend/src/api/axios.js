import axios from "axios";

// Base URL semua request API mengarah
const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    }
});

// Interceptor request — otomatis tambah token ke setiap request
// Jadi kita tidak perlu manual tambah Authorization header di setiap Axios call
api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor response — kalau response 401 (unauthorized), otomatis logout
api.interceptors.response.use(
    response => response,
    error => {
        const isLoginRequest = error.config?.url?.includes("/login");
        const isLoginPage = window.location.pathname === "/login";

        if (error.response?.status === 401 && !isLoginRequest && !isLoginPage) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;