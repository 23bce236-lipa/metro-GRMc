const express = require('express');
const router = express.Router();
const { 
  getAssets, 
  getAssetTimeline, 
  reportAsset, 
  fixAsset 
} = require('../controllers/assetController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Standard fetching routes
router.get('/', getAssets);
router.get('/:id', getAssetTimeline);

// Action routes for status changes
router.post('/:id/report', requireAuth, requireRole('Citizen'), reportAsset);
router.post('/:id/fix', requireAuth, requireRole('Tech', 'Admin'), fixAsset);

module.exports = router;