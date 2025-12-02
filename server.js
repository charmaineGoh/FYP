const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();

// Include your database name in the URI
const uri = "mongodb+srv://user1:ESCKWear1@fyp.5hfskpe.mongodb.net/inventory_db?appName=FYP";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

run();

// Example route using the connection
app.get('/items', async (req, res) => {
  try {
    const items = await client.db("inventory_db").collection("items").find().toArray();
    res.json(items);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.use(express.static('public'));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});