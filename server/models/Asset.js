const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Escalator 04"
  category: { type: String, required: true }, // e.g., "Escalator", "AFC Gate"
  station: { type: String, required: true }, // e.g., "Thaltej"
  status: { 
    type: String, 
    enum: ['Active', 'Reported', 'Under Maintenance', 'Retired'], 
    default: 'Active' 
  },
  custom_attributes: { type: Map, of: String } 
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);