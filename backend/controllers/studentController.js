const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const { success, error } = require("../utils/responseHelper");
const mongoose = require("mongoose");

// CRUD Akun Siswa/i hanya admin
const getAllStudentAccount = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "name email")
      .populate("classId", "name");

    success(res, 200, "Berhasil mengambil semua siswa dan user", students);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const createStudentAccount = async (req, res, next) => {
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

    success(res, 201, "Berhasil menambahkan user atau siswa/i", {
      user,
      student,
    });
  } catch (err) {
    return next(err);
  }
};

const updateStudentAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, classId, nis } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID user tidak valid");
    }

    const studentAccount = await User.findById(id);
    if (!studentAccount) {
      return error(res, 404, "User atau siswa/i tidak ditemukan");
    }

    const [cariClass, existingEmail, existingNis] = await Promise.all([
      classId !== undefined ? Class.findById(classId) : true,
      email !== undefined ? User.findOne({ email, _id: { $ne: id } }) : null,
      nis !== undefined ? Student.findOne({ nis, userId: { $ne: id } }) : null,
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

    // Data User yang ingin diubah
    const userData = {};
    if (name !== undefined) userData.name = name;
    if (email !== undefined) userData.email = email;
    if (password !== undefined) userData.password = password;

    // Data Student yang ingin diubah
    const studentData = {};
    if (nis !== undefined) studentData.nis = nis;
    if (classId !== undefined) {
      studentData.classId = classId;
    }

    // Update User kalau memang ada yang diubah
    if (Object.keys(userData).length > 0) {
      Object.assign(studentAccount, userData);
      await studentAccount.save();
    }

    // Update Student kalau memang ada yang diubah
    if (Object.keys(studentData).length > 0) {
      const updatedStudent = await Student.findOneAndUpdate(
        { userId: id },
        studentData,
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updatedStudent) {
        return error(res, 404, "Data siswa tidak ditemukan");
      }
    }

    success(res, 200, "Berhasil memperbarui user atau siswa/i");
  } catch (err) {
    return next(err);
  }
};

const deleteStudentAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID user tidak valid");
    }

    const studentAccount = await User.findByIdAndDelete(id);
    if (!studentAccount) {
      return error(res, 404, "User atau siswa/i tidak ditemukan");
    }

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
