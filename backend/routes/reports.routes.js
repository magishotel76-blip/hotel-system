const express = require('express');
const router = express.Router();
const {
  getReports,
  getInventoryHistory,
  getCustomerStatement,
  settleCustomerStatement
} = require('../controllers/reports.controller');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getReports);
router.get('/inventory-history', protect, getInventoryHistory);
router.get('/customer-statement', protect, getCustomerStatement);
router.post('/customer-statement/settle', protect, settleCustomerStatement);

module.exports = router;
