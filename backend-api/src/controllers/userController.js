const ExpertRequest = require('../models/ExpertRequest');

exports.getDashboard = async (req, res) => {
  res.status(200).json({ message: 'Welcome to Customer Dashboard' });
};

exports.applyForExpert = async (req, res) => {
  try {
    const { skills, experience, portfolio_link, message } = req.body;
    
    // Check if a pending request already exists
    const existingRequest = await ExpertRequest.findOne({ user_id: req.user._id, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending expert application' });
    }

    const newRequest = new ExpertRequest({
      user_id: req.user._id,
      skills,
      experience,
      portfolio_link,
      message,
      status: 'pending'
    });

    await newRequest.save();

    res.status(201).json({ message: 'Expert application submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
};
