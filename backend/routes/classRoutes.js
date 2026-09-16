const express = require('express');
const router = express.Router();
const { createClass, getAllClass } = require('../controllers/classController');

router.get('/all-class', getAllClass);
router.post('/create-class', createClass);

module.exports= router;