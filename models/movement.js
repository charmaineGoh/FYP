const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  stockId: { type: String, required: true },
  movementType: { type: String, enum: ['Inbound', 'Outbound'], required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  quantity: { type: Number, required: true },
  dateUpdated: { type: Date, default: Date.now }
}, { collection: 'movements' });

module.exports = mongoose.model('Movement', movementSchema);
