const Asset = require('../models/Asset');
const AssetLog = require('../models/AssetLog');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const getAssetId = (value) => {
  if (!/^[a-f\d]{24}$/i.test(value)) {
    throw new ApiError(400, 'INVALID_IDENTIFIER', 'The supplied asset identifier is invalid.');
  }
  return new mongoose.Types.ObjectId(value);
};

const getNotes = (body, fallback) => {
  const notes = body?.notes;
  if (notes === undefined || notes === null || notes === '') return fallback;
  if (typeof notes !== 'string' || notes.length > 2000) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Notes must be a string of at most 2000 characters.');
  }
  return notes.trim();
};

const transitionAsset = async (req, { newStatus, allowedPreviousStatuses, fallbackNotes }) => {
  const assetId = getAssetId(req.params.id);
  const notes = getNotes(req.body, fallbackNotes);
  const actorRole = req.auth?.role;
  const actorUserId = req.auth?.userId;

  if (!actorRole || !actorUserId) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required to update asset status.');
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const currentAsset = await Asset.findById(assetId).session(session);
      if (!currentAsset) throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
      if (!allowedPreviousStatuses.includes(currentAsset.status)) {
        throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `An asset in ${currentAsset.status} status cannot transition to ${newStatus}.`);
      }

      const previousStatus = currentAsset.status;
      const asset = await Asset.findOneAndUpdate(
        { _id: assetId, status: previousStatus },
        { $set: { status: newStatus } },
        { new: true, runValidators: true, session }
      );

      if (!asset) throw new ApiError(409, 'STATUS_CONFLICT', 'The asset status changed concurrently. Reload and try again.');

      const [log] = await AssetLog.create([{
        asset_id: asset._id,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by_user: new mongoose.Types.ObjectId(actorUserId),
        changed_by_role: actorRole,
        notes
      }], { session });

      result = { asset, log };
    });
  } finally {
    await session.endSession();
  }

  return result;
};

// @desc    Get all assets (For Admin Dashboard & Tech Task List)
// @route   GET /api/assets
exports.getAssets = async (req, res) => {
  const statusValues = Asset.schema.path('status').enumValues;
  if (req.query.status && !statusValues.includes(req.query.status)) {
    throw new ApiError(400, 'INVALID_STATUS', 'The requested asset status is invalid.');
  }

  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '25', 10) || 25));
  const filter = req.query.status ? { status: req.query.status } : {};

  const [assets, total] = await Promise.all([
    Asset.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Asset.countDocuments(filter)
  ]);

  res.status(200).json({
    assets,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
};

// @desc    Get single asset with its full history timeline (For Admin Side Panel)
// @route   GET /api/assets/:id
exports.getAssetTimeline = async (req, res) => {
  const assetId = getAssetId(req.params.id);
  const asset = await Asset.findById(assetId);
  if (!asset) throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset not found.');

  const logs = await AssetLog.find({ asset_id: assetId }).sort({ timestamp: 1 });
  res.status(200).json({ asset, logs });
};

// @desc    Report an asset as broken (For Citizen Form)
// @route   POST /api/assets/:id/report
exports.reportAsset = async (req, res) => {
  const { asset, log } = await transitionAsset(req, {
    newStatus: 'Reported',
    allowedPreviousStatuses: ['Active'],
    fallbackNotes: 'Reported by commuter via public portal'
  });
  res.status(200).json({ success: true, message: 'Asset reported successfully.', asset, log });
};

// @desc    Mark an asset as fixed (For Tech Mobile View)
// @route   POST /api/assets/:id/fix
exports.fixAsset = async (req, res) => {
  const { asset, log } = await transitionAsset(req, {
    newStatus: 'Active',
    allowedPreviousStatuses: ['Reported', 'Under Maintenance'],
    fallbackNotes: 'Repaired by maintenance technician'
  });
  res.status(200).json({ success: true, message: 'Asset repaired successfully.', asset, log });
};