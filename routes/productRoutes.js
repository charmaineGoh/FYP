const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Stock = require("../models/stock");

router.post("/", async (req, res) => {
  console.log("Received product data - Keys:", Object.keys(req.body));
  console.log("Product name:", req.body.productName);
  console.log("Price:", req.body.price, typeof req.body.price);
  console.log("Quantity:", req.body.quantity, typeof req.body.quantity);
  console.log("Category:", req.body.category);
  console.log("Description:", req.body.description);
  console.log("Image size:", req.body.image ? req.body.image.length : "No image");

  try {
    const { productName, price, quantity, description, image, category } = req.body;
    
    // Validate required fields
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      return res.status(400).json({ error: "Product name is required and must be a string" });
    }

    if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: "Price is required, must be a number, and greater than 0" });
    }

    if (quantity === undefined || quantity === null || typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: "Quantity is required and must be a non-negative number" });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({ error: "Description is required and must be a string" });
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: "Category is required and must be a string" });
    }

    // Check image size
    if (image && image.length > 2097152) {
      return res.status(400).json({ error: "Image is too large. Please use a smaller image (max 2MB)" });
    }

    const product = new Product(req.body);
    await product.save();
    console.log("Product saved successfully:", product._id);
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
    
    // Get old product data to detect quantity changes
    const oldProduct = await Product.findById(productId);
    if (!oldProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const oldQuantity = oldProduct.quantity;
    const newQuantity = req.body.quantity;
    const quantityDiff = newQuantity - oldQuantity;
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true }
    );
    
    // Sync quantity changes to inventory stocks
    if (quantityDiff !== 0) {
      console.log(`[sync] Product quantity changed by ${quantityDiff}. Syncing to inventory...`);
      
      // Find all stocks linked to this product and update their quantities
      const stocks = await Stock.find({ productId: productId });
      
      for (const stock of stocks) {
        const newStockQuantity = Math.max(0, stock.quantity + quantityDiff);
        await Stock.findByIdAndUpdate(
          stock._id,
          { 
            quantity: newStockQuantity,
            lastUpdated: new Date()
          },
          { new: true }
        );
        console.log(`[sync] Updated stock ${stock.stockId}: ${stock.quantity} → ${newStockQuantity}`);
      }
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