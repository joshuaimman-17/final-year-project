const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { checkAdmin } = require('../middleware/roleMiddleware');

// Apply admin check to all routes in this file
// Note: In a real implementation you would also have a verifyToken middleware before this.
// e.g., router.use(verifyToken, checkAdmin);
router.use(checkAdmin);

// /admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// /admin/users
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/role', adminController.changeUserRole);

// /admin/expert-requests
router.get('/expert-requests', adminController.viewExpertRequests);
router.put('/expert-requests/:id', adminController.handleExpertRequest);

module.exports = router;
