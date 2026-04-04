const prisma = require('../config/db');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
};

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const { category, description, amount, date, paymentMethod, transferReference } = req.body;

  try {
    const expense = await prisma.expense.create({
      data: {
        category,
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || 'cash',
        transferReference,
      },
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  const { category, description, amount, date, paymentMethod, transferReference } = req.body;

  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        category,
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        paymentMethod,
        transferReference,
      },
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  const { password } = req.body;
  if (password !== 'Tumiprincesa') {
    return res.status(401).json({ message: 'Contraseña de seguridad incorrecta' });
  }
  try {
    await prisma.expense.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Gasto eliminado de forma segura' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando el gasto', error: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
