const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeFood() {
  const foodItems = [
    { name: 'Desayuno', salePrice: 10, category: 'COMIDA', unit: 'plato' },
    { name: 'Almuerzo', salePrice: 10, category: 'COMIDA', unit: 'plato' },
    { name: 'Merienda', salePrice: 10, category: 'COMIDA', unit: 'plato' },
    { name: 'Cena', salePrice: 10, category: 'COMIDA', unit: 'plato' }
  ];

  console.log('--- Initializing Food Products ---');
  for (const item of foodItems) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name }
    });

    if (existing) {
      console.log(`Updating ${item.name}...`);
      await prisma.product.update({
        where: { id: existing.id },
        data: { 
          category: 'COMIDA',
          isSellable: true,
          unit: 'plato',
          salePrice: item.salePrice
        }
      });
    } else {
      console.log(`Creating ${item.name}...`);
      await prisma.product.create({
        data: {
          ...item,
          purchasePrice: 0,
          stock: 0,
          minStock: 0,
          isSellable: true
        }
      });
    }
  }
  console.log('--- DONE ---');
}

initializeFood().catch(console.error).finally(() => prisma.$disconnect());
