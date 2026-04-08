const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const res = await prisma.inventoryTransaction.updateMany({
      where: {
        status: 'pending',
        paymentMethod: { in: ['cash', 'transfer'] },
        roomId: null
      },
      data: {
        status: 'settled'
      }
    });
    console.log(`Updated ${res.count} direct cash/transfer transactions from 'pending' to 'settled'.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
