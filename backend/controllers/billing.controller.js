const prisma = require('../config/db');

// @desc    Get invoices
// @route   GET /api/billing
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        reservation: { include: { customer: true, room: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/billing/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        reservation: { include: { customer: true, room: true } },
        items: { include: { product: true } },
      },
    });
    if (invoice) {
      res.json(invoice);
    } else {
      res.status(404).json({ message: 'Prefactura no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
};

// @desc    Create pre-invoice (Prefactura)
// @route   POST /api/billing
// @access  Private
const createInvoice = async (req, res) => {
  const { reservationId, items } = req.body;
  // items: [{ type: 'habitacion'|'producto'|'servicio', description, quantity, unitPrice, productId? }]

  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    let totalAmount = 0;
    const formattedItems = items.map(item => {
      const totalPrice = item.quantity * item.unitPrice;
      totalAmount += totalPrice;
      return {
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        productId: item.productId || null,
      };
    });

    const invoice = await prisma.invoice.create({
      data: {
        reservationId,
        totalAmount,
        status: 'borrador', // prefactura
        items: {
          create: formattedItems,
        },
      },
      include: { items: true },
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
};

// @desc    Update invoice status (Pay)
// @route   PUT /api/billing/:id/pay
// @access  Private
const payInvoice = async (req, res) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'pagada' },
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error paying invoice', error: error.message });
  }
};

// @desc    Delete invoice completely (secure)
// @route   DELETE /api/billing/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  const { password } = req.body;
  if (password !== 'Tumiprincesa') {
    return res.status(401).json({ message: 'Contraseña de seguridad incorrecta' });
  }

  try {
    const invoiceId = req.params.id;
    // Eliminar los items de la factura primero (por si no hay cascade)
    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    // Eliminar la factura
    await prisma.invoice.delete({ where: { id: invoiceId } });
    
    res.json({ message: 'Factura/Venta eliminada de forma segura del sistema' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la factura', error: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  payInvoice,
  deleteInvoice
};
