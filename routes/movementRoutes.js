const express = require('express');
const router = express.Router();
const Movement = require('../models/movement');
const Stock = require('../models/stock');

// Get all movements
router.get('/', async (req, res) => {
  try {
    const movements = await Movement.find().sort({ dateUpdated: -1 });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movements by Stock ID
router.get('/search/:stockId', async (req, res) => {
  try {
    const { stockId } = req.params;
    const movements = await Movement.find({ stockId: stockId }).sort({ dateUpdated: -1 });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movement by ID
router.get('/:movementId', async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.movementId);
    if (!movement) {
      return res.status(404).json({ message: 'Movement not found' });
    }
    res.json(movement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new movement
router.post('/', async (req, res) => {
  try {
    const { stockId, movementType, from, to, quantity } = req.body;

    // Try to find existing stock; if missing, auto-create so it appears in Stock Levels
    let stock = await Stock.findOne({ stockId: stockId });
    let stockAutoCreated = false;
    if (!stock) {
      try {
        const warehouseLocation = movementType === 'Inbound' ? to : from;
        const initialQty = movementType === 'Inbound' ? quantity : 0; // Outbound starts at 0
        stock = new Stock({
          stockId,
          quantity: initialQty,
          warehouseLocation: warehouseLocation || 'Unassigned',
        });
        await stock.save();
        stockAutoCreated = true;
      } catch (err) {
        console.error('Failed to auto-create stock:', err.message);
      }
    }

    // Create movement record
    const movement = new Movement({ stockId, movementType, from, to, quantity });
    await movement.save();

    if (stock) {
      // Only enforce availability checks and update quantities if stock existed prior
      if (movementType === 'Outbound' && !stockAutoCreated) {
        if (stock.quantity < quantity) {
          return res.status(400).json({
            message: `Insufficient quantity. Available: ${stock.quantity}, Requested: ${quantity}`
          });
        }
        stock.quantity -= quantity;
      } else if (movementType === 'Inbound' && !stockAutoCreated) {
        stock.quantity += quantity;
      }
      stock.lastUpdated = new Date();
      await stock.save();
    }

    res.status(201).json({ message: 'Movement recorded successfully', movement, stockCreated: stockAutoCreated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update movement
router.put('/:movementId', async (req, res) => {
  try {
    const { stockId, movementType, from, to, quantity } = req.body;
    const movement = await Movement.findById(req.params.movementId);

    if (!movement) {
      return res.status(404).json({ message: 'Movement not found' });
    }

    // Reverse original movement effect if original stock exists
    const originalStock = await Stock.findOne({ stockId: movement.stockId });
    if (originalStock) {
      if (movement.movementType === 'Inbound') {
        originalStock.quantity -= movement.quantity;
      } else if (movement.movementType === 'Outbound') {
        originalStock.quantity += movement.quantity;
      }
      originalStock.lastUpdated = new Date();
      await originalStock.save();
    }

    // Apply new movement to target stock if it exists; otherwise skip stock updates
    const targetStock = await Stock.findOne({ stockId: stockId });
    if (targetStock) {
      if (movementType === 'Inbound') {
        targetStock.quantity += quantity;
      } else if (movementType === 'Outbound') {
        if (targetStock.quantity < quantity) {
          return res.status(400).json({
            message: `Insufficient quantity. Available: ${targetStock.quantity}, Requested: ${quantity}`
          });
        }
        targetStock.quantity -= quantity;
      }
      targetStock.lastUpdated = new Date();
      await targetStock.save();
    }

    // Update movement record
    movement.stockId = stockId;
    movement.movementType = movementType;
    movement.from = from;
    movement.to = to;
    movement.quantity = quantity;
    await movement.save();

    res.json({ message: 'Movement updated successfully', movement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete movement
router.delete('/:movementId', async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.movementId);

    if (!movement) {
      return res.status(404).json({ message: 'Movement not found' });
    }

    // Reverse the movement effect on stock quantity only if stock exists
    const stock = await Stock.findOne({ stockId: movement.stockId });
    if (stock) {
      if (movement.movementType === 'Inbound') {
        stock.quantity -= movement.quantity;
      } else if (movement.movementType === 'Outbound') {
        stock.quantity += movement.quantity;
      }
      stock.lastUpdated = new Date();
      await stock.save();
    }

    await Movement.findByIdAndDelete(req.params.movementId);
    res.json({ message: 'Movement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
