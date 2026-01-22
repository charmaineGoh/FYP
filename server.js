const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 

const stockRoutes = require('./routes/stockRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const userRoutes = require('./routes/userRoutes');
const movementRoutes = require('./routes/movementRoutes');



const app = express();
// Middleware: enable CORS and set larger body limits for JSON/urlencoded 
app.use(require('cors')());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error:', err));

// Mount routes
app.use('/stocks', stockRoutes); 
app.use('/products', productRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/users', userRoutes);
app.use('/movements', movementRoutes);

// HTML page routes 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
});

app.get('/index.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/dashboard.html');
});

app.get('/products.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/products.html');
});

app.get('/inventory.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/inventory.html');
});

app.get('/movement.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/movement.html');
});

app.get('/supplierDetails.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/supplierDetails.html');
});

app.get('/usermanagement.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/usermanagement.html');
});

app.get('/settings.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/settings.html');
});

app.get('/addproduct.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/addproduct.html');
});

// Static files 
app.use(express.static('public'));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
});

// HTML page routes
app.get('/index.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/dashboard.html');
});

app.get('/products.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/products.html');
});

app.get('/inventory.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/inventory.html');
});

app.get('/movement.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/movement.html');
});

app.get('/suppliers.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/suppliers.html');
});

app.get('/supplierDetails.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/supplierDetails.html');
});

app.get('/usermanagement.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/usermanagement.html');
});

app.get('/settings.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/settings.html');
});

app.get('/addproduct.html', (req, res) => {
  res.sendFile(__dirname + '/public/html/addproduct.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
