// Error handler global
const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    // Handle E11000 - duplicate key error dari MongoDB
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} sudah terdaftar`,
      data: null,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "ID tidak valid" });
  }
  res.status(500).json({ error: "Server error" });
};

module.exports = errorHandler;
