// const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");

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
    const user = await User.find();
    console.log(user);
    const student = await Student.find({});

    res.json({
      success: true,
      message: "Berhasil mengambil data akun siswa",
      data: { user, student },
    });
  } catch (error) {
    console.log(error);
  }
};

const createStudentAccount = async (req, res) => {
  try {
    const { name, email, password, classId, nis } = req.body;

    const user = await User.create({ name, email, password, role: "siswa" });
    const student = await Student.create({ userId: user._id, classId, nis });

    res.status(201).json({
      success: true,
      message: "Akun siswa berhasil dibuat",
      data: { user, student },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.log(error);
  }
};

const updateStudentAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, classId, nis } = req.body;

    await User.findByIdAndUpdate(id, { name, email, password });

    await Student.findOneAndUpdate({ userId: id }, { $set: { classId, nis } });

    return res
      .status(200)
      .json({ success: true, message: "Akun berhasil diperbarui" });
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
