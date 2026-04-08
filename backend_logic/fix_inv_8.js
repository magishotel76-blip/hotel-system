const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInvoice() {
  const custId = '720c0723-ee79-419e-874c-bb24c867b05a';
  
  // Find the invoice that was marked pagada/cash around 2026-03-26
  const customer = await prisma.customer.findUnique({
    where: { id: custId },
    include: {
      reservations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { invoices: true, room: true }
      }
    }
  });

  const res = customer.reservations[0];
  const invoice = res.invoices[0];

  if (invoice && invoice.paymentMethod === 'cash') {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentMethod: 'office',
        status: 'borrador'
      }
    });
    console.log(`Invoice ${invoice.id} changed to office/borrador`);
  }

  // Find any related inventory transactions and update them too
  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      reservationId: res.id,
      paymentMethod: 'cash'
    }
  });

  if (transactions.length > 0) {
    await prisma.inventoryTransaction.updateMany({
      where: { id: { in: transactions.map(t => t.id) } },
      data: { paymentMethod: 'office' }
    });
    console.log(`Updated ${transactions.length} inventory transactions to office`);
  }
}

fixInvoice().finally(() => prisma.$disconnect());
