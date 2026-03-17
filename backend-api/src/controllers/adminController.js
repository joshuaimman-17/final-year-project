const User = require('../models/User');
const ExpertRequest = require('../models/ExpertRequest');

exports.getDashboard = async (req, res) => {
  res.status(200).json({ message: 'Welcome to Admin Dashboard' });
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToDelete.email === 'ksdharanidharan2005@gmail.com') {
      return res.status(403).json({ message: 'Cannot delete the main admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'expert'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email === 'ksdharanidharan2005@gmail.com') {
      return res.status(403).json({ message: 'Cannot modify main admin role' });
    }

    user.role = role;
    await user.save();
    
    res.status(200).json({ message: `User role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
};

exports.viewExpertRequests = async (req, res) => {
  try {
    const requests = await ExpertRequest.find().populate('user_id', 'name email');
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
};

exports.handleExpertRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await ExpertRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    await request.save();

    // Update the user's expert_status AND role if approved
    const user = await User.findById(request.user_id);
    if (user) {
      user.expert_status = status;
      if (status === 'approved') {
        user.role = 'expert'; // Ensure role elevates
      }
      await user.save();
    }

    res.status(200).json({ message: `Expert request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process request', error: error.message });
  }
};
