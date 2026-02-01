const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  image: { type: String },
  stockId: { type: String, required: true, unique: true }, // e.g. "STK001"
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: false, default: null },
  category: { type: String, required: false },
  quantity: { type: Number, required: true },
  warehouseLocation: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'stocks' });


stockSchema.index({ stockId: 1 });
stockSchema.index({ productId: 1 });
stockSchema.index({ supplierId: 1 });
stockSchema.index({ category: 1 });
stockSchema.index({ lastUpdated: -1 });
stockSchema.index({ quantity: 1 });

module.exports = mongoose.model('Stock', stockSchema);
