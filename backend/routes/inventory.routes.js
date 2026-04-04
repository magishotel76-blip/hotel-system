const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const {
  getProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  addTransaction,
  addTransactionsBulk,
  getTransactions,
  deleteTransaction,
  uploadInvoice,
  importPdfProducts,
  registerFoodSale,
  registerInternalConsumption,
  settleTransaction
} = require('../controllers/inventory.controller');
const { protect, admin } = require('../middleware/auth');

router.route('/products')
  .get(protect, getProducts)
  .post(protect, admin, createProduct);

router.route('/products/:id')
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

router.get('/products/barcode/:barcode', protect, getProductByBarcode);

router.route('/transactions')
  .get(protect, getTransactions)
  .post(protect, admin, addTransaction);

router.post('/transactions/bulk', protect, admin, addTransactionsBulk);

router.post('/transactions/import-pdf', protect, admin, importPdfProducts);

router.route('/transactions/:id')
  .delete(protect, admin, deleteTransaction)
  .put(protect, admin, settleTransaction);

router.post('/food-sale', protect, registerFoodSale);
router.post('/internal-consumption', protect, registerInternalConsumption);

// Upload PDF Invoice endpoint
router.post('/upload-invoice', protect, admin, upload.single('invoice'), uploadInvoice);

module.exports = router;
