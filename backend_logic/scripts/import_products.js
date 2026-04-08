const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  { barcode: "7861024611060", name: "Fuze Tea 500ml", purchasePrice: 0.70, salePrice: 1.25, stock: 0, expirationDate: "2026-07-27T00:00:00.000Z", category: "Bebida" },
  { barcode: "7862109430958", name: "Gatorade 473ml", purchasePrice: 1.10, salePrice: 1.50, stock: 4, expirationDate: "2026-08-18T00:00:00.000Z", category: "Bebida" },
  { barcode: "7801610002193", name: "Fanta lata 350ml", purchasePrice: 1.30, salePrice: 1.50, stock: 2, expirationDate: "2026-07-05T00:00:00.000Z", category: "Bebida" },
  { barcode: "009497002993", name: "Pony Malta 330ml", purchasePrice: 0.50, salePrice: 1.25, stock: 11, expirationDate: "2026-05-17T00:00:00.000Z", category: "Bebidas" },
  { barcode: "7862109437599", name: "Gatorade 500ml", purchasePrice: 0.75, salePrice: 1.25, stock: 20, expirationDate: null, category: "Bebida" },
  { barcode: "7801610001196", name: "Coca Cola Lata 350ml", purchasePrice: 1.30, salePrice: 1.50, stock: 3, expirationDate: "2027-01-16T00:00:00.000Z", category: "Bebida" },
  { barcode: "7702354945992", name: "Saviloe 320ml", purchasePrice: 1.00, salePrice: 1.25, stock: 9, expirationDate: "2026-07-08T00:00:00.000Z", category: "Bebida" },
  { barcode: "7868001001401", name: "Agua Vital Joya 600ml", purchasePrice: 0.35, salePrice: 1.50, stock: 48, expirationDate: "2026-04-19T00:00:00.000Z", category: "Bebida" },
  { barcode: "7861024604222", name: "Coca Cola 3 litros", purchasePrice: 3.10, salePrice: 3.50, stock: 8, expirationDate: "2026-05-03T00:00:00.000Z", category: "Bebida" }
];

async function importProducts() {
  try {
    console.log('--- Importing Batch Products ---');
    for (const p of products) {
      const existing = await prisma.product.findUnique({ where: { barcode: p.barcode } });
      if (existing) {
        console.log(`Updating existing product: ${p.name}`);
        await prisma.product.update({
          where: { barcode: p.barcode },
          data: { ...p, isSellable: true }
        });
      } else {
        console.log(`Creating new product: ${p.name}`);
        await prisma.product.create({
          data: { ...p, isSellable: true }
        });
      }
    }
    console.log('--- IMPORT COMPLETE ---');
  } catch (error) {
    console.error('Error importing products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
