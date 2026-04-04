const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const meals = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
  
  for (const name of meals) {
    const product = await prisma.product.findFirst({ where: { name } });
    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: { category: 'COMIDA', isSellable: true }
      });
      console.log(`Updated ${name} to category COMIDA`);
    } else {
      // Create it if it doesn't exist
      await prisma.product.create({
        data: {
          name,
          category: 'COMIDA',
          salePrice: name === 'Desayuno' ? 5 : 10, // Defaults
          purchasePrice: 0,
          stock: 9999, // Meals don't usually have stock limits in this context
          minStock: 0,
          isSellable: true,
          unit: 'plato'
        }
      });
      console.log(`Created ${name} as category COMIDA`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
