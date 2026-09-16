const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Login (untuk admin & siswa)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login berhasil',
      data: { token, user: { id: user._id, name: user.name, role: user.role } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin membuat akun siswa baru
const createStudentAccount = async (req, res) => {
  try {
    const { name, email, password, classId, nis } = req.body;

    const user = await User.create({ name, email, password, role: 'siswa' });
    const student = await Student.create({ userId: user._id, classId, nis });

    res.status(201).json({
      success: true,
      message: 'Akun siswa berhasil dibuat',
      data: { user, student }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, createStudentAccount };