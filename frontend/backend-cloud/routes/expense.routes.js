const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expense.controller');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, admin, getExpenses)
  .post(protect, admin, createExpense);

router.route('/:id')
  .put(protect, admin, updateExpense)
  .delete(protect, admin, deleteExpense);

module.exports = router;
