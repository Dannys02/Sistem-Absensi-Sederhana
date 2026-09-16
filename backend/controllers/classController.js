const Class = require("../models/Class");

const getAllClass = async (req, res) => {
  try {
    const classData = await Class.find({});

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil kelas",
      data: { classData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { name } = req.body;
    const classData = await Class.create({ name });

    res.status(201).json({
      success: true,
      message: "Berhasil menambahkan kelas",
      data: { classData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    await Class.findByIdAndUpdate(id, { name });

    return res
      .status(200)
      .json({ success: true, message: "Berhasil mengubah kelas" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    await Class.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ success: true, message: "Berhasil menghapus kelas" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.log(error);
  }
};
module.exports = { getAllClass, createClass, updateClass, deleteClass };
