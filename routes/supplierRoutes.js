const express = require('express');
const router = express.Router();
const Supplier = require('../models/supplier');

// POST: Add new supplier
router.post("/", async (req, res) => {
  console.log("Received supplier data:", req.body);
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    console.error("Error saving supplier:", err);
    res.status(400).json({ error: err.message });
  }
});

// GET: All suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    console.error("Error fetching suppliers:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET: Supplier by ID
router.get("/:id", async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(supplier);
  } catch (err) {
    console.error("Error fetching supplier:", err.message);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

// PUT: Update supplier by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(updatedSupplier);
  } catch (err) {
    console.error("Error updating supplier:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Remove supplier by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!deletedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error("Error deleting supplier:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;