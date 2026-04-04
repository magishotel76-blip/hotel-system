const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing inventory transactions...');
  await prisma.inventoryTransaction.deleteMany({});
  console.log('Clearing products...');
  await prisma.product.deleteMany({});
  console.log('Successfully cleared fictitious inventory data.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
