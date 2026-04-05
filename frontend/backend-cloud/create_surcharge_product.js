const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let p = await prisma.product.findFirst({ where: { name: 'Recargo Alojamiento' } });
  if(!p) {
    p = await prisma.product.create({
      data: {
        name: 'Recargo Alojamiento',
        category: 'SERVICIO',
        purchasePrice: 0,
        salePrice: 0,
        stock: 999999,
        minStock: 0,
        unit: 'unid',
        isSellable: true
      }
    });
    console.log('Created Recargo product:', p.id);
  } else {
    console.log('Recargo product already exists:', p.id);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
