const Class = require("../models/Class");
const { success, error } = require("../utils/responseHelper");

const getAllClass = async (req, res) => {
  try {
    const classData = await Class.find({});
    success(res, 200, "Berhasil mengambil kelas", classData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { name } = req.body;

    const isNameExist = await Class.findOne({ name });
    if (isNameExist) {
      return res.status(400).json({ success: false, message: `Nama ${name} sudah digunakan` });
    }

    const classData = await Class.create({ name });
    success(res, 201, "Berhasil menambahkan kelas", classData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const classById = async (req, res) => {
  const { id } = req.params;
  const classData = await Class.findById({ _id: id });
  if (!classData) return error(res, 404, "Kelas tidak ditemukan", classData);
  success(res, 200, "Berhasil mengambil kelas berdasarkan id", classData);
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const isNameExist = await Class.findOne({ name });
    if (isNameExist) {
      return res.status(400).json({ success: false, message: `Nama ${name} sudah digunakan` });
    }
    
    await Class.findByIdAndUpdate(id, { name });
    success(res, 204, "Berhasil mengubah kelas");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    await Class.findByIdAndDelete(id);
    success(res, 204, "Berhasil menghapus kelas");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.log(error);
  }
};

module.exports = {
  getAllClass,
  createClass,
  classById,
  updateClass,
  deleteClass,
};
