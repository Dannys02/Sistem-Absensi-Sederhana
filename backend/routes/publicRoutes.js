const express = require("express");
const router = express.Router();

// import fungsi controller
const { register, login } = require("../controllers/authController");

// validasi request body
const { validateCreateStudent } = require("../request/validateUserStudent");

// Auth
router.post("/register", validateCreateStudent, register);
router.post("/login", login);

module.exports = router;
