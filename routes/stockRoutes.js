const express = require('express');
const router = express.Router();
const Stock = require('../models/stock');

// ✅ Add inventory (stock)
router.post("/", async (req, res) => {
  console.log("Received stock data:", req.body);
  try {
    const stock = new Stock(req.body);
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    console.error("Error saving stock:", err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all inventory
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find(); // remove populate for now
    res.json(stocks);
  } catch (err) {
    console.error("Error fetching inventory:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update stock by stockId
router.put("/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const updated = await Stock.findOneAndUpdate(
      { stockId },           // match by stockId
      req.body,              // update with new data
      { new: true }          // return updated document
    );

    if (!updated) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating stock:", err.message);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

//Get one stock by stockId
router.get("/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const stock = await Stock.findOne({ stockId }).populate("productId");
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }
    res.json(stock);
  } catch (err) {
    console.error("Error fetching stock:", err.message);
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

module.exports = router;