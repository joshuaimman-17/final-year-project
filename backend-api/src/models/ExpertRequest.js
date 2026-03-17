const mongoose = require('mongoose');

const expertRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
  portfolio_link: {
    type: String,
  },
  message: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('ExpertRequest', expertRequestSchema);
