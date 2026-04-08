const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const paidCashInvoicesTotal = await prisma.invoice.aggregate({
      where: { 
        status: 'pagada', 
        paymentMethod: 'cash'
      },
      _sum: { totalAmount: true }
    });
    const cashFromInvoices = paidCashInvoicesTotal._sum.totalAmount || 0;

    const pendingCashSalesTotal = await prisma.inventoryTransaction.findMany({
      where: {
        type: 'salida',
        exitType: 'venta',
        paymentMethod: 'cash',
        status: 'pending'
      },
      include: { product: true }
    });
    const cashFromPendingSales = pendingCashSalesTotal.reduce((acc, sale) => acc + (sale.quantity * (sale.price || sale.product.salePrice)), 0);

    const allCashExpensesTotal = await prisma.expense.aggregate({
      where: { paymentMethod: 'cash' },
      _sum: { amount: true }
    });
    const totalCashExpenses = allCashExpensesTotal._sum.amount || 0;

    console.log('--- DB Cash Flow ---');
    console.log('Invoices Cash:', cashFromInvoices);
    console.log('Pending Sales Cash:', cashFromPendingSales);
    console.log('Expenses Cash:', totalCashExpenses);
    console.log('Total Cash in Hotel:', cashFromInvoices + cashFromPendingSales - totalCashExpenses);
    
    // Check old records without cash
    const allExpenses = await prisma.expense.findMany();
    const noMethodExpenses = allExpenses.filter(e => !e.paymentMethod || e.paymentMethod === '');
    console.log('Expenses with no paymentMethod:', noMethodExpenses.length);
    
    const allInvoices = await prisma.invoice.findMany();
    const noMethodInvoices = allInvoices.filter(i => !i.paymentMethod || i.paymentMethod === '');
    console.log('Invoices with no paymentMethod:', noMethodInvoices.length);
    console.log('Total Invoices (any method):', allInvoices.reduce((a, b) => a + b.totalAmount, 0));
}

test().catch(console.error).finally(() => prisma.$disconnect());
