const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // load .env

const stockRoutes = require('./routes/stockRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const userRoutes = require('./routes/userRoutes');
const movementRoutes = require('./routes/movementRoutes');



const app = express();
app.use(express.json());
app.use(require('cors')()); // Add this if you face 'CORS' errors during development

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error:', err));

// Mount routes
app.use('/stocks', stockRoutes); // The dashboard stats will be at /stocks/dashboard/stats
app.use('/products', productRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/users', userRoutes);
app.use('/movements', movementRoutes);

// Static files (Make sure your dashboard.html is inside the 'public' folder)
app.use(express.static('public')); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
