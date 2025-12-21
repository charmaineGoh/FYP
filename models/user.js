const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  position: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "admin", "staff"], required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { collection: "users" });

module.exports = mongoose.model("User", usersSchema);