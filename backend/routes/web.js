const express = require("express");
const router = express.Router();

const { login, createStudentAccount, getAllStudentAccount, updateStudentAccount, deleteStudentAccount } = require("../controllers/authController");
const { validateCreateClass, validateUpdateClass } = require("../request/validateClass");
const { validateCreateStudent, validateUpdateStudent } = require("../request/validateUserStudent");
const { createClass, getAllClass, updateClass, deleteClass, classById } = require("../controllers/classController");

// Auth
router.post("/login", login);

// CRUD Student
router.get("/all-student", getAllStudentAccount);
router.post("/create-student", validateCreateStudent, createStudentAccount);
router.put("/update-student/:id", validateUpdateStudent, updateStudentAccount);
router.delete("/delete-student/:id", deleteStudentAccount);

// CRUD Class
router.get("/all-class", getAllClass);
router.get("/show-class/:id", classById);
router.post("/create-class", validateCreateClass, createClass );
router.put("/update-class/:id", validateUpdateClass, updateClass );
router.delete("/delete-class/:id", deleteClass);

// Error handler async
router.use((err, req, res, next) => {
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
});

module.exports = router;
