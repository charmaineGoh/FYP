const express = require("express");
const router = express.Router();
const User = require("../models/user");

// CREATE user
router.post("/", async (req, res) => {
  try {
    const { name, companyName, position, role, email, status } = req.body;
    const user = new User({ name, companyName, position, role, email, status });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;