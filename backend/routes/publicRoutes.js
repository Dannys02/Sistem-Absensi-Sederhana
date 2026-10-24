const express = require("express");
const router = express.Router();

// import fungsi controller
const { register, login, me } = require("../controllers/authController");

// validasi request body
const { validateCreateStudent } = require("../request/validateUserStudent");
const { authenticate } = require("../middleware/authenticate");

// Auth
router.post("/register", validateCreateStudent, register);
router.post("/login", login);
router.get("/me", authenticate, me);

module.exports = router;
