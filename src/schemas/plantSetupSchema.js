const mongoose = require("mongoose");

const plantSetupSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  plantStore: {
    type: [String],
    default: [],
  },
  plantStoreName: {
    type: [String],
    default: [],
  },
  money: {
    type: Number,
    default: 10000,
  },
  level: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("PlantSetup", plantSetupSchema);
