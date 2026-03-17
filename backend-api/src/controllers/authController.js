const User = require('../models/User');
// Note: In a real app, you would use bcrypt for password hashing and jwt for tokens
// Since the prompt states "My system already has a working Customer login and functionality.",
// this may just be standard endpoints or placeholders to connect to the existing system.

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Default role is 'customer', expert_status is 'none'.
    // The pre-save hook in User model will auto-assign 'admin' if email is ksdharanidharan2005@gmail.com
    const newUser = new User({
      name,
      email,
      password, // Password hashing should be done here in prod
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: { id: newUser._id, email: newUser.email, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user || user.password !== password) { // Password verification step
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Determine redirect path
    let redirectUrl = '/user/dashboard';
    if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'customer' && user.expert_status === 'approved') {
      redirectUrl = '/expert/dashboard';
    }

    // Return token and redirect URL
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        expert_status: user.expert_status
      },
      redirect: redirectUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};
