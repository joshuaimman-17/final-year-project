const ExpertRequest = require('../models/ExpertRequest');

exports.getDashboard = async (req, res) => {
  res.status(200).json({ message: 'Welcome to Expert Dashboard. Here you can view assigned tasks.' });
};

exports.getExpertTasks = async (req, res) => {
  // In a full implementation, you'd fetch tasks assigned to `req.user.id`
  try {
    res.status(200).json({ message: 'List of expert tasks', tasks: [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};
