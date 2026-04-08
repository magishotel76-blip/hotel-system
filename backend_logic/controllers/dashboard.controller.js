const prisma = require('../config/db');
const { startOfDay, startOfMonth, endOfDay, endOfMonth } = require('date-fns');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private
const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    
    // 1. Ocupación (habitaciones ocupadas vs total)
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({ where: { status: 'ocupada' } });
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    // Habitaciones disponibles
    const availableRooms = await prisma.room.count({ where: { status: 'disponible' } });

    // 2. Ingresos del mes REALES (Facturas Pagadas + Ventas Rápidas en Efectivo/Transferencia)
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    const monthlyInvoices = await prisma.invoice.aggregate({
      where: {
        status: 'pagada',
        updatedAt: { gte: monthStart, lte: monthEnd }
      },
      _sum: { totalAmount: true }
    });
    const monthlyFastSales = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida', exitType: 'venta', status: { in: ['pending', 'settled'] }, paymentMethod: { in: ['cash', 'transfer'] },
        createdAt: { gte: monthStart, lte: monthEnd }
      },
      include: { product: true }
    });
    const monthlyFastSalesTotal = monthlyFastSales.reduce((acc, sale) => acc + (sale.quantity * (sale.price || sale.product?.salePrice || 0)), 0);
    const monthlyIncome = (monthlyInvoices._sum.totalAmount || 0) + monthlyFastSalesTotal;

    // Ingresos del día REALES
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);
    
    const dailyInvoices = await prisma.invoice.aggregate({
      where: {
        status: 'pagada',
        updatedAt: { gte: dayStart, lte: dayEnd }
      },
      _sum: { totalAmount: true }
    });
    const dailyFastSales = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida', exitType: 'venta', status: { in: ['pending', 'settled'] }, paymentMethod: { in: ['cash', 'transfer'] },
        createdAt: { gte: dayStart, lte: dayEnd }
      },
      include: { product: true }
    });
    const dailyFastSalesTotal = dailyFastSales.reduce((acc, sale) => acc + (sale.quantity * (sale.price || sale.product?.salePrice || 0)), 0);
    const dailyIncome = (dailyInvoices._sum.totalAmount || 0) + dailyFastSalesTotal;

    // 3. Productos con poco stock (menor a 10, por ejemplo)
    const lowStockProducts = await prisma.product.count({
      where: { stock: { lt: 10 } },
    });

    // 4. Reservas Activas
    const activeReservationsCount = await prisma.reservation.count({
      where: { status: 'activa' },
    });

    // 5. Ingreso Tentativo (Basado en habitaciones ocupadas * su precio + ventas del día)
    const activeRooms = await prisma.reservation.findMany({
      where: { 
        status: 'activa',
        room: { status: 'ocupada' }
      },
      include: { room: true, customer: true }
    });
    const projectedRoomRevenue = activeRooms.reduce((acc, res) => {
      const priceToUse = res.customer?.lodgingPrice ?? res.room?.pricePerNight ?? 0;
      return acc + priceToUse;
    }, 0);
    
    // 5.1 Ventas PENDIENTES DEL DÍA (Cuentas por cobrar generadas exclusivamente hoy)
    const unpaidSales = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida',
        exitType: 'venta',
        status: 'pending',
        createdAt: { gte: dayStart, lte: dayEnd }
      },
      include: { product: true }
    });
    const unpaidSalesTotal = unpaidSales.reduce((acc, sale) => acc + (sale.quantity * (sale.price || sale.product?.salePrice || 0)), 0);

    // Tentativo Diario: Habitaciones ocupadas (hoy) + Cuentas por cobrar activas + Ingresos Rápidos Efectivo Hoy
    // NOTA: Se solicitó sumar explícitamente las ventas en efectivo del día actual.
    const tentativeRevenue = projectedRoomRevenue + unpaidSalesTotal + dailyFastSalesTotal;

    // Reporte al frontend para desgloses interactivos
    const unpaidSalesToday = unpaidSales; // Renamed to maintain frontend compatibility even though it's all pending sales

    // 5.2 Ventas de Comidas DEL DÍA (Solo categoría COMIDA, cualquier método de pago)
    const dailyFoodSales = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida',
        exitType: 'venta',
        createdAt: { gte: dayStart, lte: dayEnd },
        product: { category: 'COMIDA' }
      },
      include: { product: true }
    });
    const foodRevenue = dailyFoodSales.reduce((acc, sale) => acc + (sale.quantity * (sale.price || sale.product?.salePrice || 0)), 0);


    // 6. Efectivo en Caja (CUMULATIVO: Total Entradas Cash - Total Salidas Cash)
    
    // 6.1 Ingresos por facturas PAGADAS en efectivo (Acumulado)
    const paidCashInvoicesTotal = await prisma.invoice.aggregate({
      where: { 
        status: 'pagada', 
        paymentMethod: 'cash'
      },
      _sum: { totalAmount: true }
    });
    const cashFromInvoices = paidCashInvoicesTotal._sum.totalAmount || 0;

    // 6.2 Ingresos por ventas rápidas (no ligadas a habitación) de pago en efectivo
    const cashSalesTotal = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida',
        exitType: 'venta',
        paymentMethod: 'cash'
      },
      include: { product: true }
    });
    const cashFromSales = cashSalesTotal.reduce((acc, sale) => acc + (sale.quantity * (sale.price || sale.product.salePrice)), 0);


    // 6.3 Gastos Totales en EFECTIVO (Acumulado)
    const allCashExpensesTotal = await prisma.expense.aggregate({
      where: { paymentMethod: 'cash' },
      _sum: { amount: true }
    });
    const totalCashExpenses = allCashExpensesTotal._sum.amount || 0;

    const cashInHotel = cashFromInvoices + cashFromSales - totalCashExpenses;

    // 6.4 (Historial Completo para la Caja)
    const allPaidCashInvoices = await prisma.invoice.findMany({
      where: { 
        status: 'pagada', 
        paymentMethod: 'cash'
      },
      select: { id: true, totalAmount: true, updatedAt: true }
    });

    const allCashSales = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida',
        exitType: 'venta',
        paymentMethod: 'cash'
      },
      include: { product: true }
    });

    const allCashIncomes = [
      ...allPaidCashInvoices.map(inv => ({ ...inv, description: 'Factura Cobrada' })),
      ...allCashSales.map(sale => ({
        id: sale.id,
        totalAmount: sale.quantity * (sale.price || sale.product?.salePrice || 0),
        updatedAt: sale.createdAt,
        description: `Venta: ${sale.product?.name || 'Producto Desconocido'}`
      }))
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const allExpenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      select: { id: true, amount: true, description: true, category: true, paymentMethod: true, date: true }
    });
    // Convert 'date' to 'updatedAt' for frontend consistency if needed, or update frontend to read date.
    const formattedExpenses = allExpenses.map(exp => ({...exp, date: exp.date}));

    // 7. Cuentas por Cobrar Acumuladas (Todo lo que está en 'office' y 'pending')
    const pendingTransactions = await prisma.inventoryTransaction.findMany({
      where: { 
        type: 'salida', 
        exitType: 'venta', 
        paymentMethod: 'office', 
        status: 'pending' 
      },
      include: { product: true, customer: true, room: true }
    });
    const totalPendingOffice = pendingTransactions.reduce((acc, t) => acc + (t.quantity * (t.price || t.product?.salePrice || 0)), 0);

    const occupiedRoomsList = await prisma.room.findMany({
      where: { status: 'ocupada' },
      include: { roomType: true }
    });

    // 8. Low stock products (properly filtered)
    const lowStockProductsList = await prisma.product.findMany({
      where: {
        stock: { lte: 10 } // Simplified threshold for now, or fetch all and filter in JS if needed
      }
    });

    res.json({
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate: occupancyRate.toFixed(1),
      monthlyIncome,
      dailyIncome,
      lowStockProducts,
      activeReservationsCount,
      tentativeRevenue,
      cashInHotel,
      foodRevenueToday: foodRevenue,
      totalPendingOffice,
      breakdowns: {
        activeRooms,
        unpaidSalesToday,
        pendingTransactions,
        dailyFoodSales,
        cashIncomes: allCashIncomes,
        expenses: formattedExpenses,
        dailyReservations: await prisma.reservation.findMany({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            status: { in: ['activa', 'completada'] },
          },
          include: { customer: true, room: true }
        }),
        occupiedRoomsList,
        lowStockProductsList
      }
    });
  } catch (error) {
    console.error('Error in getDashboardMetrics:', error);
    res.status(500).json({ message: 'Error fetching metrics', error: error.message });
  }
};

module.exports = { getDashboardMetrics };
