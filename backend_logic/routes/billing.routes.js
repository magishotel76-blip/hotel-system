const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  payInvoice,
  deleteInvoice,
  getPendingChargesByReservation
} = require('../controllers/billing.controller');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.get('/pending/:reservationId', protect, getPendingChargesByReservation);

router.route('/:id')
  .get(protect, getInvoiceById)
  .delete(protect, admin, deleteInvoice);

router.put('/:id/pay', protect, payInvoice);

module.exports = router;
