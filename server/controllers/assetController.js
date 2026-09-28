const Asset = require('../models/Asset');
const AssetLog = require('../models/AssetLog');

// @desc    Get all assets (For Admin Dashboard & Tech Task List)
// @route   GET /api/assets
exports.getAssets = async (req, res) => {
  try {
    // If a status query is provided (e.g., ?status=Reported), filter by it
    const filter = req.query.status ? { status: req.query.status } : {};
    const assets = await Asset.find(filter).sort({ createdAt: -1 });
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single asset with its full history timeline (For Admin Side Panel)
// @route   GET /api/assets/:id
exports.getAssetTimeline = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // Fetch chronological logs for this specific asset
    const logs = await AssetLog.find({ asset_id: req.params.id }).sort({ timestamp: 1 });
    
    res.status(200).json({ asset, logs });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Report an asset as broken (For Citizen Form)
// @route   POST /api/assets/:id/report
exports.reportAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const previousStatus = asset.status;
    asset.status = 'Reported';
    await asset.save(); // Update the asset

    // SYSTEM THINKING: Create the audit log immediately
    const log = await AssetLog.create({
      asset_id: asset._id,
      previous_status: previousStatus,
      new_status: 'Reported',
      changed_by_role: 'Citizen',
      notes: req.body.notes || 'Reported by commuter via public portal'
    });

    res.status(200).json({ message: 'Asset reported successfully', asset, log });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark an asset as fixed (For Tech Mobile View)
// @route   POST /api/assets/:id/fix
exports.fixAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const previousStatus = asset.status;
    asset.status = 'Active';
    await asset.save(); 

    // SYSTEM THINKING: Create the audit log immediately
    const log = await AssetLog.create({
      asset_id: asset._id,
      previous_status: previousStatus,
      new_status: 'Active',
      changed_by_role: 'Tech',
      notes: req.body.notes || 'Repaired by maintenance technician'
    });

    res.status(200).json({ message: 'Asset repaired successfully', asset, log });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};