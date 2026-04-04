const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true }
  });
  console.log('--- PRODUCTS IN DB ---');
  products.forEach(p => {
    console.log(`ID: ${p.id} | Name: [${p.name}] | Category: [${p.category}]`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
