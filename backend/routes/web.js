const express = require("express");
const router = express.Router();

const { login, createStudentAccount, getAllStudentAccount, updateStudentAccount, deleteStudentAccount } = require("../controllers/authController");
const { validateCreateClass, validateUpdateClass } = require("../request/validateClass");
const { validateCreateStudent, validateUpdateStudent } = require("../request/validateUserStudent");
const { createClass, getAllClass, updateClass, deleteClass, classById } = require("../controllers/classController");

const authenticate = require('../middleware/authenticate');

// Auth
router.post("/login", login);

// CRUD Student
router.get("/all-student", authenticate, getAllStudentAccount);
router.post("/create-student", authenticate, validateCreateStudent, createStudentAccount);
router.put("/update-student/:id", authenticate, validateUpdateStudent, updateStudentAccount);
router.delete("/delete-student/:id", authenticate, deleteStudentAccount);

// CRUD Class
router.get("/all-class", authenticate, getAllClass);
router.get("/show-class/:id", authenticate, classById);
router.post("/create-class", authenticate, validateCreateClass, createClass );
router.put("/update-class/:id", authenticate, validateUpdateClass, updateClass );
router.delete("/delete-class/:id", authenticate, deleteClass);

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
