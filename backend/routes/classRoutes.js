const express = require('express');
const router = express.Router();
const { createClass, getAllClass, updateClass, deleteClass } = require('../controllers/classController');

router.get('/all-class', getAllClass);
router.post('/create-class', createClass);
router.put('/update-class/:id', updateClass);
router.delete('/delete-class/:id', deleteClass);

module.exports= router;