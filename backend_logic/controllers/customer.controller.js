const prisma = require('../config/db');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { company: true }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { reservations: true },
    });
    
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Cliente no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  const { 
    name, document, phone, email, address, notes, companyId, clientType,
    customRoomPrice, customBreakfastPrice, customLunchPrice, customSnackPrice, customDinnerPrice,
    companyIndividualPrice, companySharedPrice 
  } = req.body;

  try {
    const customerExists = await prisma.customer.findUnique({ where: { document } });
    if (customerExists) {
      return res.status(400).json({ message: 'Ya existe un cliente con ese documento' });
    }

    const customer = await prisma.customer.create({
      data: { 
        name, document, phone, email, address, notes, companyId, clientType: clientType || 'NATURAL',
        customRoomPrice: customRoomPrice ? parseFloat(customRoomPrice) : null,
        customBreakfastPrice: customBreakfastPrice ? parseFloat(customBreakfastPrice) : null,
        customLunchPrice: customLunchPrice ? parseFloat(customLunchPrice) : null,
        customSnackPrice: customSnackPrice ? parseFloat(customSnackPrice) : null,
        customDinnerPrice: customDinnerPrice ? parseFloat(customDinnerPrice) : null,
        companyIndividualPrice: companyIndividualPrice ? parseFloat(companyIndividualPrice) : null,
        companySharedPrice: companySharedPrice ? parseFloat(companySharedPrice) : null
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  const { 
    name, document, phone, email, address, notes, companyId, clientType,
    customRoomPrice, customBreakfastPrice, customLunchPrice, customSnackPrice, customDinnerPrice,
    companyIndividualPrice, companySharedPrice
  } = req.body;

  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { 
        name, document, phone, email, address, notes, companyId, clientType,
        customRoomPrice: customRoomPrice ? parseFloat(customRoomPrice) : null,
        customBreakfastPrice: customBreakfastPrice ? parseFloat(customBreakfastPrice) : null,
        customLunchPrice: customLunchPrice ? parseFloat(customLunchPrice) : null,
        customSnackPrice: customSnackPrice ? parseFloat(customSnackPrice) : null,
        customDinnerPrice: customDinnerPrice ? parseFloat(customDinnerPrice) : null,
        companyIndividualPrice: companyIndividualPrice ? parseFloat(companyIndividualPrice) : null,
        companySharedPrice: companySharedPrice ? parseFloat(companySharedPrice) : null
      },
    });
    res.json(customer);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    // Si falla porque tiene reservas, devolver error amigable
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'No se puede eliminar porque tiene reservas asociadas' });
    }
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
