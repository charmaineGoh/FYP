const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // load .env

const stockRoutes = require('./routes/stockRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(express.json()); // required for POST body parsing

// Connect using .env variable
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' Connected to MongoDB');
  })
  .catch((err) => {
    console.error(' Error connecting to MongoDB:', err);
  });

// Mount routes
app.use('/stocks', stockRoutes);
app.use('/products', productRoutes);

// Optional static serving
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});