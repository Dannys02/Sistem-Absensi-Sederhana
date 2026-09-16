const express = require('express');
const router = express.Router();
const { login, createStudentAccount, getAllStudentAccount, updateStudentAccount, deleteStudentAccount } = require('../controllers/authController');

// auth
router.post('/login', login);

// CRUD student
router.get('/all-student', getAllStudentAccount);
router.post('/create-student', createStudentAccount);
router.put('/update-student/:id', updateStudentAccount);
router.delete('/delete-student/:id', deleteStudentAccount);

module.exports = router;