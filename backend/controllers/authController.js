// const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const { success, error } = require("../utils/responseHelper");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// register bisa diakses admin dan siswa
const register = async (req, res) => {
  try {
    const { name, email, password, classId, nis } = req.body;
    const cariClass = await Class.findById(classId);

    if (!cariClass) {
      return error(res, 404, "Kelas tidak ditemukan");
    }

    const user = await User.create({ name, email, password, role: "siswa" });
    const student = await Student.create({ userId: user._id, classId, nis });
    success(res, 201, "Berhasil membuat akun", { user, student });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// Login bisa diakses admin dan siswa
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log(user);
    console.log(typeof user.comparePassword);

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

// CRUD Akun Siswa/i hanya admin
const getAllStudentAccount = async (req, res) => {
  try {
    const [users, students] = await Promise.all([
      User.find({ role: "siswa" }),
      Student.find(),
    ]);

    const data = { users, students };

    success(res, 200, "Berhasil mengambil semua siswa dan user", data);
  } catch (error) {
    return error(res, 500, error.message);
  }
};

const createStudentAccount = async (req, res) => {
  try {
    const { name, email, password, classId, nis } = req.body;
    const user = await User.create({ name, email, password, role: "siswa" });
    const student = await Student.create({ userId: user._id, classId, nis });

    const cariClass = await Class.findById(id);

    if (!cariClass) {
      return error(res, 404, "Kelas tidak ditemukan");
    }

    success(res, 201, "Berhasil menambahkan user atau siswa/i");
  } catch (error) {
    return error(res, 500, error.message);
  }
};

const updateStudentAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, classId, nis } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID kelas tidak valid");
    }

    const userUpdate = await User.findByIdAndUpdate(id, {
      name,
      email,
      password,
    });
    const updatedStudent = await Student.findOneAndUpdate(
      { userId: id },
      { $set: { classId, nis } },
    );

    if (!updatedStudent) {
      return error(res, 404, "User atau siswa tidak ditemukan");
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true },
    );
    if (!updatedClass) {
      return error(res, 404, "User atau siswa tidak ditemukan");
    }

    success(res, 204, "Berhasil memperbarui user atau siswa/i");
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStudentAccount = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    await Student.deleteOne({ userId: id });

    return res
      .status(200)
      .json({ success: true, message: "Akun berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  createStudentAccount,
  getAllStudentAccount,
  updateStudentAccount,
  deleteStudentAccount,
};
