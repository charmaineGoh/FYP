const mongoose = require("mongoose");

const suppliersSchema = new mongoose.Schema({
    supplierName: { type: String, required: true },
    supplierContactName: { type: String, required: true },
    supplierPhone: { type: String, required: true },
    supplierEmail: { type: String, required: true },
    supplierAddress: { type: String, required: true },
    supplierCity: { type: String, required: true },
    supplierCountry: { type: String, required: true }
}, { collection: "suppliers" });

module.exports = mongoose.model("Supplier", suppliersSchema);