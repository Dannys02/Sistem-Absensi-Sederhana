const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const { success, error } = require("../utils/responseHelper");
const mongoose = require("mongoose");

// CRUD Akun Siswa/i hanya admin
const getAllStudentAccount = async (req, res) => {
  try {
    const [users, students] = await Promise.all([
      User.find({ role: "siswa" }),
      Student.find(),
    ]);

    const data = { users, students };

    success(res, 200, "Berhasil mengambil semua siswa dan user", data);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const createStudentAccount = async (req, res) => {
  try {
    const { name, email, password, classId, nis } = req.body;

    const cariClass = await Class.findById(classId);
    if (!cariClass) {
      return error(res, 404, "Kelas tidak ditemukan");
    }

    const user = await User.create({ name, email, password, role: "siswa" });
    const student = await Student.create({ userId: user._id, classId, nis });

    success(res, 201, "Berhasil menambahkan user atau siswa/i", {
      user,
      student,
    });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const updateStudentAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, classId, nis } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID kelas tidak valid");
    }

    const userUpdate = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        password,
      },
      { new: true, runValidators: true },
    );
    const updatedStudent = await Student.findOneAndUpdate(
      { userId: id },
      { $set: { classId, nis } },
      { new: true, runValidators: true },
    );

    if (!userUpdate || !updatedStudent) {
      return error(res, 404, "User atau siswa tidak ditemukan");
    }

    success(res, 200, "Berhasil memperbarui user atau siswa/i");
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const deleteStudentAccount = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    await Student.deleteOne({ userId: id });

    success(res, 200, "Berhasil menghapus user atau siswa/i");
  } catch (err) {
    return error(res, 500, err.message);
  }
};

module.exports = {
  createStudentAccount,
  getAllStudentAccount,
  updateStudentAccount,
  deleteStudentAccount,
};
