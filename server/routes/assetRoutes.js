const express = require('express');
const router = express.Router();
const { 
  getAssets, 
  getAssetTimeline, 
  reportAsset, 
  fixAsset 
} = require('../controllers/assetController');

// Standard fetching routes
router.get('/', getAssets);
router.get('/:id', getAssetTimeline);

// Action routes for status changes
router.post('/:id/report', reportAsset);
router.post('/:id/fix', fixAsset);

module.exports = router;