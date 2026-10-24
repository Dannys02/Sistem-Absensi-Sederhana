const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const { success, error } = require("../utils/responseHelper");
const jwt = require("jsonwebtoken");

// register bisa diakses admin dan siswa
const register = async (req, res, next) => {
  try {
    const { name, email, password, classId, nis } = req.body;
    
    const [cariClass, existingEmail, existingNis] = await Promise.all([
      Class.findById(classId),
      User.findOne({ email }),
      Student.findOne({ nis }),
    ]);

    if (!cariClass) {
      return error(res, 404, "Kelas tidak ditemukan");
    }
    if (existingEmail) {
      return error(res, 409, "email sudah terdaftar");
    }
    if (existingNis) {
      return error(res, 409, "nis sudah terdaftar");
    }

    const user = await User.create({ name, email, password, role: "siswa" });
    const student = await Student.create({ userId: user._id, classId, nis });
    success(res, 201, "Berhasil membuat akun", { user, student });
  } catch (err) {
    return next(err);
  }
};

// Login bisa diakses admin dan siswa
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return error(res, 401, "Email atau password salah");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 401, "Email atau password salah");
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    success(res, 201, "Berhasil login", { token, user });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User tidak ditemukan",
      data: null,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Data user berhasil diambil",
    data: user,
  });
};

module.exports = {
  register,
  login,
  me,
};
