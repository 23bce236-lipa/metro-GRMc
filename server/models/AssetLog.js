const mongoose = require('mongoose');

const assetLogSchema = new mongoose.Schema({
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  previous_status: { type: String, required: true },
  new_status: { type: String, required: true },
  changed_by_role: { type: String, enum: ['Citizen', 'Tech', 'Admin'], required: true },
  notes: { type: String }, 
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AssetLog', assetLogSchema);