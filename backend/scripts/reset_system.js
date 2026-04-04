const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetSystem() {
  try {
    console.log('--- Resetting Operational Data ---');
    
    // Delete in correct order of dependency
    console.log('Deleting Invoice Items...');
    await prisma.invoiceItem.deleteMany();
    
    console.log('Deleting Invoices...');
    await prisma.invoice.deleteMany();
    
    console.log('Deleting Inventory Transactions...');
    await prisma.inventoryTransaction.deleteMany();
    
    console.log('Resetting Product Stocks to 0...');
    await prisma.product.updateMany({
      data: { stock: 0 }
    });
    
    console.log('Deleting Reservations...');
    await prisma.reservation.deleteMany();
    
    console.log('Deleting Web Reservations...');
    await prisma.webReservation.deleteMany();
    
    console.log('Deleting Expenses...');
    await prisma.expense.deleteMany();
    
    console.log('Resetting Room Status to disponible...');
    await prisma.room.updateMany({
      data: { status: 'disponible' }
    });

    console.log('--- SYSTEM RESET COMPLETE ---');
    console.log('Note: User, Customer, Room, and Product definitions were preserved.');
  } catch (error) {
    console.error('CRITICAL ERROR resetting system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSystem();
