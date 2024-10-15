const mongoose = require("mongoose");

const shopsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
  shopType: {
    type: String,
    enum: ["Flower Shop", "Tree Nursery", "Herb Garden", "Exotic Plants"],
    required: true,
  },
  plants: [
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: "",
      },
      price: {
        type: Number,
        required: true,
      },
      stock: {
        type: Number,
        default: 0,
        max: 100,
      },
    },
  ],
  lastRestocked: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Shops", shopsSchema);
