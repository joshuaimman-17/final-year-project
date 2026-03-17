const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'expert', 'admin'],
    default: 'customer',
  },
  expert_status: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
}, { timestamps: true });

// Pre-save hook to ensure admin role for specific email
userSchema.pre('save', function (next) {
  if (this.email === 'ksdharanidharan2005@gmail.com') {
    this.role = 'admin';
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
