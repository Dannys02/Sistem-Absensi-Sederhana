// const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");
const { success, error } = require("../utils/responseHelper");
const mongoose = require("mongoose");

// Login bisa diakses admin dan siswa
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: "Login berhasil",
      data: { token, user: { id: user._id, name: user.name, role: user.role } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CRUD Akun Siswa/i hanya admin
const getAllStudentAccount = async (req, res) => {
  try {
    const [users, students] = await Promise.all([User.find(), Student.find()]);
    // Gabungkan dalam objek
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

    const cntClass = await Class.findById(id);

    if (!cntClass) {
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
  login,
  createStudentAccount,
  getAllStudentAccount,
  updateStudentAccount,
  deleteStudentAccount,
};
