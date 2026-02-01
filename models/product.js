const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true }
}, { collection: "products" });


productSchema.index({ category: 1 });
productSchema.index({ productName: 1 });
productSchema.index({ quantity: 1 });

module.exports = mongoose.model("Product", productSchema);
