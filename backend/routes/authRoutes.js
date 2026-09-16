const express = require('express');
const router = express.Router();
const { login, createStudentAccount } = require('../controllers/authController');

router.post('/login', login);
router.post('/create-student', createStudentAccount);

module.exports = router;