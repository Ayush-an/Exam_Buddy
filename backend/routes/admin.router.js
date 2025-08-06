// admin.router.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Admin = require('../models/admin.model');
// Admin Sign Up
router.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;
  if (!['question-paper-setter', 'moderator'].includes(role)) {
    return res.status(400).send({ error: 'Invalid role specified' });
  }
  try {
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).send({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashedPassword, role });
    await admin.save();
    res.send({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).send({ error: 'Signup failed' });
  }
});
// Admin Sign In
router.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    res.send({
      message: 'Signin successful',
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).send({ error: 'Signin failed' });
  }
});
module.exports = router;