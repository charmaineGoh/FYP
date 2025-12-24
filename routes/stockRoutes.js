const express = require('express');
const router = express.Router();
const Stock = require('../models/stock');

// ✅ NEW: Get Dashboard Stats (Filterable by Date)
// Access this via: GET /stocks/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter object based on 'lastUpdated' from your schema
    let query = {};
    if (startDate && endDate) {
      query.lastUpdated = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stocks = await Stock.find(query).sort({ lastUpdated: -1 });

    // 1. Calculate Total Stock Level (Sum of all quantities)
    const totalStock = stocks.reduce((sum, item) => sum + item.quantity, 0);

    // 2. Count Unique Warehouse Locations
    const uniqueLocations = [...new Set(stocks.map(item => item.warehouseLocation))].length;

    // 3. Prepare Chart Data (Labels: Stock IDs, Values: Quantities)
    const chartData = stocks.map(item => ({
      label: item.stockId,
      value: item.quantity
    }));

    res.json({
      totalStock,
      locationCount: uniqueLocations,
      recentMovements: stocks.length, // Treating filtered records as movements
      rawData: stocks,
      chartData: chartData
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err.message);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

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
    const stocks = await Stock.find(); 
    res.json(stocks);
  } catch (err) {
    console.error("Error fetching inventory:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get one stock by stockId
// (Moved below /stats so "stats" isn't treated as an ID)
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

// ✅ Update stock by stockId
router.put("/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const updated = await Stock.findOneAndUpdate(
      { stockId },
      { ...req.body, lastUpdated: Date.now() }, // Ensure timestamp updates
      { new: true }
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

module.exports = router;
module.exports = router;
