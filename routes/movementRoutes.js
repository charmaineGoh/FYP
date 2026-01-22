const express = require('express');
const router = express.Router();
const Movement = require('../models/movement');
const Stock = require('../models/stock');
const Product = require('../models/product');
const Supplier = require('../models/supplier');

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
    const { stockId, movementType, from, to, quantity, category } = req.body;

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
          category
        });
        await stock.save();
        stockAutoCreated = true;
      } catch (err) {
        console.error('Failed to auto-create stock:', err.message);
      }
    }

    // If stock exists and category provided, update category 
    if (stock && category) {
      stock.category = category;
      await stock.save();
    }

    // Find or create supplier based on "from" field
    if (stock && from) {
      let supplier = await Supplier.findOne({ supplierName: from });
      
      
      if (!supplier) {
        supplier = new Supplier({
          supplierName: from,
          supplierContactName: 'N/A',
          supplierPhone: 'N/A',
          supplierEmail: 'N/A',
          supplierAddress: 'N/A',
          supplierCity: 'N/A',
          supplierCountry: 'N/A'
        });
        await supplier.save();
      }
      
      // Link supplier to stock
      stock.supplierId = supplier._id;
      await stock.save();
    }

    // Create movement record
    const movement = new Movement({ stockId, movementType, from, to, quantity, category });
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
      
      // Find and link product 
      if (!stock.productId) {
        const linkedProduct = await Product.findOne({ productName: stockId });
        if (linkedProduct) {
          stock.productId = linkedProduct._id;
        }
      }
      
      // Update linked product quantity for both new and existing stocks
      if (stock.productId) {
        const product = await Product.findById(stock.productId);
        if (product) {
          if (movementType === 'Outbound') {
            product.quantity -= quantity;
          } else if (movementType === 'Inbound') {
            product.quantity += quantity;
          }
          await product.save();
        }
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
    const { stockId, movementType, from, to, quantity, category } = req.body;
    const movement = await Movement.findById(req.params.movementId);

    if (!movement) {
      return res.status(404).json({ message: 'Movement not found' });
    }

    const oldStockId = movement.stockId;
    const stockIdChanged = oldStockId !== stockId;

    // Reverse original movement effect if original stock exists
    const originalStock = await Stock.findOne({ stockId: movement.stockId });
    if (originalStock) {
      if (movement.movementType === 'Inbound') {
        originalStock.quantity -= movement.quantity;
      } else if (movement.movementType === 'Outbound') {
        originalStock.quantity += movement.quantity;
      }
      
      // Reverse original movement effect on linked product
      if (originalStock.productId) {
        const origProduct = await Product.findById(originalStock.productId);
        if (origProduct) {
          if (movement.movementType === 'Inbound') {
            origProduct.quantity -= movement.quantity;
          } else if (movement.movementType === 'Outbound') {
            origProduct.quantity += movement.quantity;
          }
          await origProduct.save();
        }
      }

    
      if (stockIdChanged) {
        originalStock.stockId = stockId;
        
        // Update linked product's productName if exists
        if (originalStock.productId) {
          const linkedProduct = await Product.findById(originalStock.productId);
          if (linkedProduct && linkedProduct.productName === oldStockId) {
            linkedProduct.productName = stockId;
            await linkedProduct.save();
          }
        }
        
        // Update all other movements with this stockId
        await Movement.updateMany(
          { stockId: oldStockId },
          { stockId: stockId }
        );
      }

      originalStock.lastUpdated = new Date();
      await originalStock.save();
    }

    // Apply new movement to target stock if it exists
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
      
      // Apply new movement effect on linked product
      if (targetStock.productId) {
        const newProduct = await Product.findById(targetStock.productId);
        if (newProduct) {
          if (movementType === 'Inbound') {
            newProduct.quantity += quantity;
          } else if (movementType === 'Outbound') {
            newProduct.quantity -= quantity;
          }
          await newProduct.save();
        }
      }
      
      if (category) {
        targetStock.category = category;
      }
      
      // Find or create supplier based on "from" field and link to stock
      if (from) {
        let supplier = await Supplier.findOne({ supplierName: from });
        
        // If supplier doesn't exist, create a basic one
        if (!supplier) {
          supplier = new Supplier({
            supplierName: from,
            supplierContactName: 'N/A',
            supplierPhone: 'N/A',
            supplierEmail: 'N/A',
            supplierAddress: 'N/A',
            supplierCity: 'N/A',
            supplierCountry: 'N/A'
          });
          await supplier.save();
        }
        
        // Link supplier to stock
        targetStock.supplierId = supplier._id;
      }
      
      targetStock.lastUpdated = new Date();
      await targetStock.save();
    }

    // Update movement record
    movement.stockId = stockId;
    movement.movementType = movementType;
    movement.category = category;
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
      
      // Reverse the movement effect on linked product quantity
      if (stock.productId) {
        const product = await Product.findById(stock.productId);
        if (product) {
          if (movement.movementType === 'Inbound') {
            product.quantity -= movement.quantity;
          } else if (movement.movementType === 'Outbound') {
            product.quantity += movement.quantity;
          }
          await product.save();
        }
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
