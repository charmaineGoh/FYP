const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  image: { type: String },
  stockId: { type: String, required: true, unique: true }, // e.g. "STK001"
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: false, default: null },
  quantity: { type: Number, required: true },
  warehouseLocation: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'stocks' });

module.exports = mongoose.model('Stock', stockSchema);