const prisma = require('../config/db');

// @desc    Get comprehensive reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Configurar filtros de fecha si existen
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      // Ajustar fin del día para lte para incluir el día completo
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      dateFilter.lte = endD;
    }

    // 1. Ocupación de Habitaciones (Siempre en vivo o aproximada)
    const rooms = await prisma.room.findMany();
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'ocupada').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 2. Ingresos Totales (Facturas pagadas)
    const invoiceWhere = { status: 'pagada' };
    if (Object.keys(dateFilter).length > 0) {
      invoiceWhere.createdAt = dateFilter;
    }
    
    const paidInvoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: { totalAmount: true, updatedAt: true, paymentMethod: true }
    });
    
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const cashRevenue = paidInvoices.filter(inv => inv.paymentMethod === 'cash').reduce((acc, inv) => acc + inv.totalAmount, 0);
    const transferRevenue = totalRevenue - cashRevenue;

    // 3. Gastos Totales (Diferenciando Efectivo de Transferencia)
    const expenseWhere = {};
    if (Object.keys(dateFilter).length > 0) {
      expenseWhere.date = dateFilter;
    }
    
    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      select: { amount: true, date: true, description: true, paymentMethod: true }
    });
    
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const cashExpenses = expenses
      .filter(exp => exp.paymentMethod === 'cash')
      .reduce((acc, exp) => acc + exp.amount, 0);
    const officeExpenses = expenses
      .filter(exp => exp.paymentMethod !== 'cash')
      .reduce((acc, exp) => acc + exp.amount, 0);

    // 4. Beneficio Neto
    const netProfit = totalRevenue - totalExpenses;

    // 5. Ingreso Tentativo (Ocupación actual + todas las ventas del día)
    // Buscamos reservas activas que cubran el día de hoy o el rango seleccionado
    const activeReservations = await prisma.reservation.findMany({
      where: { 
        status: 'activa',
        room: { status: 'ocupada' }
      },
      include: { room: true, customer: true }
    });
    
    // Ingreso proyectado equivalente a la tarifa de la noche actual
    const projectedRoomRevenue = activeReservations.reduce((acc, res) => {
      const priceToUse = res.customer?.lodgingPrice ?? res.room?.pricePerNight ?? 0;
      return acc + priceToUse;
    }, 0);
    
    // Sumamos todas las ventas de inventario del rango (facturas formales)
    const allInvoices = await prisma.invoice.findMany({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      select: { totalAmount: true }
    });
    const totalSalesRevenue = allInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    
    // ==========================================
    // 8. DATA PARA TABLAS DE "VENTAS EXACTAS" EN REPORTES (Cuentas por cobrar / Pendientes)
    // ==========================================
    const detailedPendingSales = await prisma.inventoryTransaction.findMany({
      where: { 
        type: 'salida', exitType: 'venta', paymentMethod: 'office', status: 'pending',
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      },
      include: { product: true }
    });
    
    // Pendientes totales del rango para el cálculo maestro Tentativo (Igual a Dashboard)
    const pendingSales = await prisma.inventoryTransaction.findMany({
      where: { 
        type: 'salida', exitType: 'venta', paymentMethod: 'office', status: 'pending',
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) 
      },
      include: { product: true }
    });
    const pendingSalesRevenue = pendingSales.reduce((acc, sale) => acc + (sale.quantity * (sale.price || sale.product?.salePrice || 0)), 0);
    
    // Proyectado real exacto al Dashboard
    const tentativeTotalRevenue = projectedRoomRevenue + pendingSalesRevenue;

    // 6. Ingresos y Gastos de los últimos 7 días para el gráfico
    const refDate = endDate ? new Date(endDate) : new Date();
    const chartDays = 7;
    const dateRangeForChart = Array.from({ length: chartDays }, (_, i) => {
      const d = new Date(refDate);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const chartStartDate = new Date(refDate);
    chartStartDate.setDate(chartStartDate.getDate() - (chartDays - 1));
    chartStartDate.setHours(0,0,0,0);
    
    const refDateEnd = new Date(refDate);
    refDateEnd.setHours(23,59,59,999);

    const chartInvoices = await prisma.invoice.findMany({
       where: { status: 'pagada', updatedAt: { gte: chartStartDate, lte: refDateEnd } },
       select: { totalAmount: true, updatedAt: true }
    });
    
    const chartFastSales = await prisma.inventoryTransaction.findMany({
       where: { 
         type: 'salida', exitType: 'venta', paymentMethod: { in: ['cash', 'transfer'] },
         createdAt: { gte: chartStartDate, lte: refDateEnd }
       },
       include: { product: true }
    });

    const chartExpenses = await prisma.expense.findMany({
       where: { date: { gte: chartStartDate, lte: refDateEnd } },
       select: { amount: true, date: true }
    });

    const chartData = dateRangeForChart.map(dateStr => {
      const invRevenue = chartInvoices
        .filter(inv => new Date(inv.updatedAt).toISOString().split('T')[0] === dateStr)
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
        
      const fastSalesRevenue = chartFastSales
        .filter(sale => new Date(sale.createdAt).toISOString().split('T')[0] === dateStr)
        .reduce((sum, sale) => sum + (sale.quantity * (sale.price || sale.product.salePrice)), 0);

      const dayRevenue = invRevenue + fastSalesRevenue;
        
      const dayExpense = chartExpenses
        .filter(exp => new Date(exp.date).toISOString().split('T')[0] === dateStr)
        .reduce((sum, exp) => sum + exp.amount, 0);

      return {
        date: dateStr,
        ingresos: dayRevenue,
        gastos: dayExpense
      };
    });

    // 7. Data for Detailed Specialized Reports
    const internalConsumptions = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida',
        exitType: 'uso_interno',
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      },
      include: { product: true }
    });

    const allOutflows = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida',
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      },
      include: { product: true, room: true, customer: true }
    });

    res.json({
      summary: {
        totalRooms,
        occupancyRate,
        totalRevenue,
        cashRevenue,
        transferRevenue,
        totalExpenses,
        cashExpenses,
        officeExpenses,
        tentativeTotalRevenue,
        netProfit,
        activeReservationsCount: await prisma.reservation.count({ where: { status: 'activa' } })
      },
      detailedReports: {
        expenses,
        internalConsumptions,
        activeReservations,
        allInvoices,
        pendingSales,
        allOutflows
      },
      chartData
    });

  } catch (error) {
    res.status(500).json({ message: 'Error generating reports', error: error.message });
  }
};

// @desc    Get inventory history
// @route   GET /api/reports/inventory-history
// @access  Private
const getInventoryHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      const lteDate = new Date(endDate);
      lteDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: new Date(startDate),
        lte: lteDate
      };
    }

    const history = await prisma.inventoryTransaction.findMany({
      where,
      select: {
        id: true, productId: true, type: true, exitType: true, quantity: true, 
        price: true,
        notes: true, paymentMethod: true, transferReference: true, createdAt: true,
        product: { select: { name: true, category: true, salePrice: true } },
        room: { select: { roomNumber: true } },
        customer: { select: { name: true, clientType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory history', error: error.message });
  }
};

// @desc    Get statement for a specific customer
// @route   GET /api/reports/customer-statement
// @access  Private
const getCustomerStatement = async (req, res) => {
  try {
    const { customerId, startDate, endDate } = req.query;

    if (!customerId) {
        return res.status(400).json({ message: 'Se requiere customerId' });
    }

    const where = { customerId, status: 'pending' };
    if (startDate && endDate) {
      const lteDate = new Date(endDate);
      lteDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: new Date(startDate),
        lte: lteDate
      };
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: { select: { name: true, salePrice: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = transactions.reduce((acc, t) => acc + (t.quantity * (t.price || t.product.salePrice)), 0);
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    res.json({
      customer,
      transactions,
      summary: {
        totalConsumptions: transactions.length,
        totalAmount: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer statement', error: error.message });
  }
};

// @desc    Settle outstanding consumptions for a customer and create a finalized invoice
// @route   POST /api/reports/customer-statement/settle
// @access  Private
const settleCustomerStatement = async (req, res) => {
  const { customerId, transactionIds, finalAmount, paymentMethod, notes } = req.body;

  try {
    // 1. Verify customer
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado' });

    // 2. Create the finalized Invoice
    const invoice = await prisma.invoice.create({
      data: {
        totalAmount: parseFloat(finalAmount),
        status: 'pagada',
        paymentMethod: paymentMethod || 'office',
        invoiceType: 'NORMAL',
        companyId: customerId, // Linked to the company
        items: {
          create: {
            type: 'servicio',
            description: notes || `Liquidación de consumos acumulados (${transactionIds.length} ítems)`,
            quantity: 1,
            unitPrice: parseFloat(finalAmount),
            totalPrice: parseFloat(finalAmount)
          }
        }
      }
    });

    // 3. Mark the inventory transactions as settled
    await prisma.inventoryTransaction.updateMany({
      where: {
        id: { in: transactionIds },
        customerId: customerId
      },
      data: {
        status: 'settled'
      }
    });

    res.json({ message: 'Consumos liquidados con éxito', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error al liquidar consumos', error: error.message });
  }
};

module.exports = {
  getReports,
  getInventoryHistory,
  getCustomerStatement,
  settleCustomerStatement
};
