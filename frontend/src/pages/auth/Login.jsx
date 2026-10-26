import { useState } from "react";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Data Registrasi:", formData);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#4F7942]/20 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#4F7942]/10 text-[#4F7942] mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#4F7942]">Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Silakan isi data diri Anda dengan benar untuk masuk ke AbsensiKu
          </p>
        </div>

        {/* Form Registrasi */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F7942] focus:border-[#4F7942] transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F7942] focus:border-[#4F7942] transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#4F7942] hover:bg-[#3d6032] active:bg-[#324f29] text-white font-semibold rounded-lg shadow-sm transition duration-150 cursor-pointer"
          >
            Masuk Sekarang
          </button>
        </form>

        <div className="flex items-center justify-center border-t pt-6 border-gray-100 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Belum memiliki akun?
            <a href="/register" className="pl-1 text-blue-600 hover:underline">
              Masuk ke Halaman Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
