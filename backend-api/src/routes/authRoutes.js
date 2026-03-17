const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// /auth/login
router.post('/login', authController.login);

// /auth/register
router.post('/register', authController.register);

module.exports = router;
