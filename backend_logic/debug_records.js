const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- INVOICES ---');
  const invoices = await prisma.invoice.findMany({
    include: { items: true, reservation: { include: { customer: true } } }
  });
  invoices.forEach(inv => {
    console.log(`ID: ${inv.id}, Status: ${inv.status}, Total: ${inv.totalAmount}, Customer: ${inv.reservation?.customer?.name || 'N/A'}`);
  });

  console.log('\n--- EXPENSES ---');
  const expenses = await prisma.expense.findMany();
  expenses.forEach(exp => {
    console.log(`ID: ${exp.id}, Category: ${exp.category}, Desc: ${exp.description}, Amount: ${exp.amount}`);
  });
}

main().finally(() => prisma.$disconnect());
