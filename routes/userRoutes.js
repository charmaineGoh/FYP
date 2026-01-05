const express = require("express");
const router = express.Router();
const User = require("../models/user");

// LOGIN route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    if (user.status !== "active") {
      return res.status(403).json({ error: "Account is inactive" });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    res.json({ 
      message: "Login successful", 
      user: {
        _id: user._id,
        name: user.name,
        position: user.position,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// CREATE user
router.post("/", async (req, res) => {
  try {
    const { name, position, role, email, password, status } = req.body;
    const user = new User({ name, position, role, email, password, status });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE user
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE user
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;