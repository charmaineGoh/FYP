const express = require('express');
const router = express.Router();
const Stock = require('../models/stock');
const Product = require('../models/product');

// Get Dashboard Stats (Filterable by Date)

router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    
    let query = {};
    if (startDate && endDate) {
      query.lastUpdated = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stocks = await Stock.find(query).sort({ lastUpdated: -1 });

    const totalStock = stocks.reduce((sum, item) => sum + item.quantity, 0);

  
    const uniqueLocations = [...new Set(stocks.map(item => item.warehouseLocation))].length;

    
    const chartData = stocks.map(item => ({
      label: item.stockId,
      value: item.quantity
    }));

    res.json({
      totalStock,
      locationCount: uniqueLocations,
      recentMovements: stocks.length, 
      rawData: stocks,
      chartData: chartData
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err.message);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// Add inventory (stock)
router.post("/", async (req, res) => {
  console.log("Received stock data:", req.body);
  try {
    const { productId, stockId, quantity, warehouseLocation } = req.body;

    
    let finalStockId = stockId;
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      
      if (!finalStockId) {
        const count = await Stock.countDocuments({ productId });
        finalStockId = `STK-${productId.toString().slice(-8)}-${count + 1}`;
      }
    }

    const stock = new Stock({
      productId,
      stockId: finalStockId,
      quantity,
      warehouseLocation
    });

    await stock.save();
    const populatedStock = await stock.populate('productId');
    res.status(201).json(populatedStock);
  } catch (err) {
    console.error("Error saving stock:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all inventory
router.get('/', async (req, res) => {
  try {
    const { limit, skip, category, sortBy = 'lastUpdated', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (category) {
      query.category = category;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    let stocksQuery = Stock.find(query)
      .populate('productId', 'productName category price') // Only select needed fields
      .populate('supplierId', 'supplierName supplierEmail') // Only select needed fields
      .sort(sort)
      .lean(); // Use lean() for faster queries when we don't need Mongoose documents
    
    // Apply pagination if specified
    if (limit) {
      stocksQuery = stocksQuery.limit(parseInt(limit));
    }
    if (skip) {
      stocksQuery = stocksQuery.skip(parseInt(skip));
    }
    
    // Add cache headers for better performance
    res.set('Cache-Control', 'public, max-age=30'); // Cache for 30 seconds
    
    const stocks = await stocksQuery;
    res.json(stocks);
  } catch (err) {
    console.error("Error fetching inventory:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get one stock by stockId

router.get("/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const stock = await Stock.findOne({ stockId }).populate("productId").populate("supplierId");
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }
    res.json(stock);
  } catch (err) {
    console.error("Error fetching stock:", err.message);
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

// Update stock by stockId
router.put("/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;
    const updated = await Stock.findOneAndUpdate(
      { stockId },
      { ...req.body, lastUpdated: Date.now() }, 
      { new: true }
    ).populate('productId').populate('supplierId');

    if (!updated) {
      return res.status(404).json({ error: "Stock not found" });
    }

 
    const product = await Product.findOne({ productName: stockId });
    
    if (product) {
     
      const allStocksWithThisId = await Stock.find({ stockId: stockId });
      const totalQuantity = allStocksWithThisId.reduce((sum, stock) => sum + stock.quantity, 0);
      
      // Update product quantity
      await Product.findByIdAndUpdate(
        product._id,
        { quantity: totalQuantity },
        { new: true }
      );
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating stock:", err.message);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// Delete stock by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Stock.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json({ message: "Stock deleted successfully", deleted });
  } catch (err) {
    console.error("Error deleting stock:", err.message);
    res.status(500).json({ error: "Failed to delete stock" });
  }
});

module.exports = router;
