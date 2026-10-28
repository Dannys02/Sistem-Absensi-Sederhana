const Class = require("../models/Class");
const mongoose = require("mongoose");
const { success, error } = require("../utils/responseHelper");

const getAllClass = async (req, res) => {
  try {
    const classData = await Class.find({});
    success(res, 200, "Berhasil mengambil kelas", classData);
  } catch (error) {
    return error(res, 500, error.message);
  }
};

const createClass = async (req, res) => {
  try {
    const { name } = req.body;

    const adaNama = await Class.findOne({ name });
    if (adaNama) {
      return error(res, 400, `Nama ${name} sudah digunakan`);
    }

    const classData = await Class.create({ name });
    success(res, 201, "Berhasil menambahkan kelas", classData);
  } catch (error) {
    return error(res, 500, error.message);
  }
};

const classById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID kelas tidak valid");
    }

    const classData = await Class.findById(id);
    if (!classData) return error(res, 404, "Kelas tidak ditemukan", classData);

    success(res, 200, "Berhasil mengambil kelas berdasarkan id", classData);
  } catch (error) {
    return error(res, 500, error.message);
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID kelas tidak valid");
    }

    const adaNama = await Class.findOne({ name, _id: { $ne: id } });
    if (adaNama) {
      return error(res, 400, `Nama ${name} sudah digunakan`);
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true },
    );

    if (!updatedClass) {
      return error(res, 404, "Kelas tidak ditemukan");
    }

    success(res, 200, "Berhasil memperbarui kelas", updatedClass);
  } catch (err) {
    return error(res, 500, err.message);
  }
};
  
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 400, "Format ID kelas tidak valid");
    }

    const deletedClass = await Class.findByIdAndDelete(id);
    if (!deletedClass) {
      return error(res, 404, "Kelas tidak ditemukan");
    }

    success(res, 200, "Berhasil menghapus kelas");
  } catch (error) {
    return error(res, 500, error.message);
  }
};

module.exports = {
  getAllClass,
  createClass,
  classById,
  updateClass,
  deleteClass,
};
