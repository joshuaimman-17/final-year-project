// backend-api/src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const expertRoutes = require('./routes/expertRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In a real application, you'd use a JWT verification middleware here:
// const { verifyToken } = require('./middleware/authMiddleware');

// Routes
app.use('/auth', authRoutes);

// Apply verifyToken to protected routes in a real environment
// app.use('/admin', verifyToken, adminRoutes);
app.use('/admin', adminRoutes);
app.use('/expert', expertRoutes);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
  res.send('Dr.Plant Role Management API is running.');
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dr_plant';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
