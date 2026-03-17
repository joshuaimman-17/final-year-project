const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');
const { checkExpert } = require('../middleware/roleMiddleware');

// Apply expert role check
router.use(checkExpert);

// /expert/dashboard
router.get('/dashboard', expertController.getDashboard);

// /expert/tasks
router.get('/tasks', expertController.getExpertTasks);

module.exports = router;
