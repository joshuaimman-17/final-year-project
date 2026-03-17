const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkCustomer } = require('../middleware/roleMiddleware');

// Standard user route check
router.use(checkCustomer);

// /user/dashboard
router.get('/dashboard', userController.getDashboard);

// Apply for expert role
router.post('/apply-expert', userController.applyForExpert);

module.exports = router;
