const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboard.controller');
const { protect, admin } = require('../middleware/auth');

router.get('/metrics', protect, admin, getDashboardMetrics);

module.exports = router;
