const express = require("express");
const router = express.Router();
const Product = require("../models/product");

router.post("/", async (req, res) => {
  console.log("Received product data:", req.body);
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Error saving product:", err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Error fetching inventory:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching stock:", err.message);
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

router.put("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(400).json({ error: err.message });
  }
});

// Always export the router
module.exports = router;