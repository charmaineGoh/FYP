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

    // Validate that stock exists
    const stock = await Stock.findOne({ stockId: stockId });
    if (!stock) {
      return res.status(404).json({ message: 'Stock ID not found' });
    }

    // For outbound movements, check if quantity is available
    if (movementType === 'Outbound') {
      if (stock.quantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity. Available: ${stock.quantity}, Requested: ${quantity}` 
        });
      }
    }

    // Create movement record
    const movement = new Movement({
      stockId,
      movementType,
      from,
      to,
      quantity
    });

    await movement.save();

    // Update stock quantity based on movement type
    if (movementType === 'Inbound') {
      stock.quantity += quantity;
    } else if (movementType === 'Outbound') {
      stock.quantity -= quantity;
    }
    stock.lastUpdated = new Date();
    await stock.save();

    res.status(201).json({ message: 'Movement recorded successfully', movement });
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

    // Get the stock record
    const stock = await Stock.findOne({ stockId: movement.stockId });
    
    // Reverse the original movement effect on quantity
    if (movement.movementType === 'Inbound') {
      stock.quantity -= movement.quantity;
    } else if (movement.movementType === 'Outbound') {
      stock.quantity += movement.quantity;
    }

    // Validate new stock ID if changed
    if (stockId !== movement.stockId) {
      const newStock = await Stock.findOne({ stockId: stockId });
      if (!newStock) {
        return res.status(404).json({ message: 'New Stock ID not found' });
      }
    }

    // Apply new movement
    if (movementType === 'Inbound') {
      stock.quantity += quantity;
    } else if (movementType === 'Outbound') {
      if (stock.quantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity. Available: ${stock.quantity}, Requested: ${quantity}` 
        });
      }
      stock.quantity -= quantity;
    }

    stock.lastUpdated = new Date();
    await stock.save();

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

    // Reverse the movement effect on stock quantity
    const stock = await Stock.findOne({ stockId: movement.stockId });
    
    if (movement.movementType === 'Inbound') {
      stock.quantity -= movement.quantity;
    } else if (movement.movementType === 'Outbound') {
      stock.quantity += movement.quantity;
    }

    stock.lastUpdated = new Date();
    await stock.save();

    await Movement.findByIdAndDelete(req.params.movementId);
    res.json({ message: 'Movement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
