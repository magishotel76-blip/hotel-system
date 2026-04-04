const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findFirst({ where: { name: 'Recargo Alojamiento' } });
  if (!p) {
    await prisma.product.create({
      data: {
        name: 'Recargo Alojamiento',
        description: 'Producto genérico para recargos o penalidades manuales',
        category: 'OTROS',
        isSellable: true,
        salePrice: 0,
        costPrice: 0,
        stock: 1000,
        minStock: 0,
        unit: 'unid'
      }
    });
    console.log('Created Recargo Alojamiento');
  } else {
    console.log('Already exists');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
