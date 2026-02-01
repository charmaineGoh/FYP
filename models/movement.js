const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  stockId: { type: String, required: true },
  movementType: { type: String, enum: ['Inbound', 'Outbound'], required: true },
  category: { type: String, enum: ['Shirts', 'Pants', 'Accessories'], required: false },
  from: { type: String, required: true },
  to: { type: String, required: true },
  quantity: { type: Number, required: true },
  dateUpdated: { type: Date, default: Date.now }
}, { collection: 'movements' });


movementSchema.index({ stockId: 1 });
movementSchema.index({ dateUpdated: -1 });
movementSchema.index({ movementType: 1 });
movementSchema.index({ category: 1 });

module.exports = mongoose.model('Movement', movementSchema);
