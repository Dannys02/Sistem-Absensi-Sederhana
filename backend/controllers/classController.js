const Class = require("../models/Class");

const getAllClass = async (req, res) => {
  try {
    const classData = await Class.find({});

    res.json({
      success: true,
      message: "Berhasil mengambil data kelas",
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

    res.json({
      success: true,
      message: "Berhasil tambahkan data kelas",
      data: { classData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllClass, createClass };
