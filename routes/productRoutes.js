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
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.put("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
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

router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Always export the router
module.exports = router;