const mongoose = require('mongoose');

const assetLogSchema = new mongoose.Schema({
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  previous_status: { type: String, enum: ['Active', 'Reported', 'Under Maintenance', 'Retired'], required: true },
  new_status: { type: String, enum: ['Active', 'Reported', 'Under Maintenance', 'Retired'], required: true },
  changed_by_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changed_by_role: { type: String, enum: ['Citizen', 'Tech', 'Admin'], required: true },
  notes: { type: String, maxlength: 2000 },
  timestamp: { type: Date, default: Date.now }
});

assetLogSchema.index({ asset_id: 1, timestamp: 1 });

assetLogSchema.pre('save', function () {
  if (!this.isNew) throw new Error('Asset logs are immutable.');
});

for (const operation of [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete'
]) {
  assetLogSchema.pre(operation, function () {
    throw new Error('Asset logs are immutable.');
  });
}

assetLogSchema.pre('deleteOne', { document: true, query: false }, function () {
  throw new Error('Asset logs are immutable.');
});

module.exports = mongoose.model('AssetLog', assetLogSchema);