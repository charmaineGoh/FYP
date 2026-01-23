const express = require('express');
const router = express.Router();
const User = require('../models/user');

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    console.log('Login route called with:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    console.log('Finding user with email:', email);
    const user = await User.findOne({ email });
    console.log('User found:', user);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password (assuming plain text for now - should use bcrypt in production)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user data (excluding password)
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
