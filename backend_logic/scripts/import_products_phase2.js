const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  { barcode: "8410095005149", name: "Cereza Verde 160 gr", category: "Repostería", purchasePrice: 3.35, stock: 2, expirationDate: "2029-09-10T00:00:00.000Z" },
  { barcode: "7861015120076", name: "Mermelada varios sabores 600ml", category: "Repostería", purchasePrice: 4.03, stock: 4, expirationDate: "2027-06-12T00:00:00.000Z" },
  { barcode: "7861001911121", name: "Mermelada varios sabores 290gr", category: "Repostería", purchasePrice: 2.65, stock: 2, expirationDate: "2027-12-18T00:00:00.000Z" },
  { barcode: "7861042556824", name: "Leche Evaporada 410ml", category: "Repostería", purchasePrice: 2.59, stock: 2, expirationDate: "2026-10-18T00:00:00.000Z" },
  { barcode: "8445291182745", name: "Leche Condensada 393ml", category: "Repostería", purchasePrice: 2.50, stock: 6, expirationDate: "2026-08-10T00:00:00.000Z" },
  { barcode: "7861001922271", name: "Duraznos mitades en lata 820g", category: "Repostería", purchasePrice: 5.13, stock: 4, expirationDate: "2029-07-06T00:00:00.000Z" },
  { barcode: "7861008901446", name: "Flan Cajita", category: "Repostería", purchasePrice: 1.65, stock: 11, expirationDate: "2026-06-21T00:00:00.000Z" },
  { barcode: "7862109400548", name: "Chispas de Chocolate 200g", category: "Repostería", purchasePrice: 2.73, stock: 3, expirationDate: "2027-01-16T00:00:00.000Z" },
  { barcode: "7861008901897", name: "Escencia de Coco", category: "Repostería", purchasePrice: 8.58, stock: 1, expirationDate: "2026-08-20T00:00:00.000Z" },
  { barcode: "7861008901828", name: "Escencia de Vainilla", category: "Repostería", purchasePrice: 6.45, stock: 2, expirationDate: "2026-09-09T00:00:00.000Z" },
  { barcode: "7862107781939", name: "Miel de abeja 450ml", category: "Repostería", purchasePrice: 10.00, stock: 1, expirationDate: "2026-11-17T00:00:00.000Z" },
  { barcode: "7861063507966", name: "Miel de Maple 355ml", category: "Repostería", purchasePrice: 3.55, stock: 1, expirationDate: "2027-03-22T00:00:00.000Z" },
  { barcode: "7861008900500", name: "Coco Rallado 500g", category: "Repostería", purchasePrice: 10.13, stock: 4, expirationDate: "2027-01-06T00:00:00.000Z" },
  { barcode: "7861008900333", name: "Fruta confitada 500g", category: "Repostería", purchasePrice: 3.33, stock: 2, expirationDate: "2026-08-20T00:00:00.000Z" },
  { barcode: "7861046000170", name: "Grageas de colores 200g", category: "Repostería", purchasePrice: 1.24, stock: 1, expirationDate: "2028-01-01T00:00:00.000Z" },
  { barcode: "7861008900210", name: "Azúcar impalpable 500g", category: "Repostería", purchasePrice: 1.60, stock: 1, expirationDate: "2027-01-15T00:00:00.000Z" },
  { barcode: "7861008912886", name: "Gelatina sin sabor 500g", category: "Repostería", purchasePrice: 13.81, stock: 1, expirationDate: "2026-09-30T00:00:00.000Z" },
  { barcode: "7862122742533", name: "Leche de Coco 500ml", category: "Repostería", purchasePrice: 3.00, stock: 4, expirationDate: "2027-07-16T00:00:00.000Z" },
  { barcode: "7861057500027", name: "Sal 2kg", category: "Abastos", purchasePrice: 0.97, stock: 13, expirationDate: "2028-01-06T00:00:00.000Z" },
  { barcode: "7861042578871", name: "Panela", category: "Repostería", purchasePrice: 2.53, stock: 7, expirationDate: "2026-07-21T00:00:00.000Z" },
  { barcode: "7862100142522", name: "Papel Aluminio 150 m", category: "Plásticos", purchasePrice: 15.00, stock: 2, expirationDate: null },
  { barcode: "01", name: "Hojaldrina margarina 2.5kg", category: "Repostería", purchasePrice: 9.49, stock: 1, expirationDate: "2026-04-11T00:00:00.000Z" },
  { barcode: "7861001235524", name: "Tres Leches 1 litro", category: "Repostería", purchasePrice: 4.57, stock: 3, expirationDate: "2026-09-20T00:00:00.000Z" },
  { barcode: "7861008914200", name: "Crema Chantipack 1 litro", category: "Repostería", purchasePrice: 7.62, stock: 1, expirationDate: "2026-10-16T00:00:00.000Z" },
  { barcode: "7861008900364", name: "Crema pastelera 500g", category: "Repostería", purchasePrice: 1.74, stock: 6, expirationDate: "2026-10-02T00:00:00.000Z" },
  { barcode: "7861042577775", name: "Gelatina varios sabores", category: "Repostería", purchasePrice: 2.80, stock: 15, expirationDate: "2026-07-24T00:00:00.000Z" },
  { barcode: "7862106455053", name: "Cobertura de Chocolate negro 200g", category: "Repostería", purchasePrice: 3.75, stock: 3, expirationDate: "2027-06-18T00:00:00.000Z" },
  { barcode: "7861005205660", name: "Café pasado 360gr", category: "Abastos", purchasePrice: 5.00, stock: 18, expirationDate: "2026-10-16T00:00:00.000Z" },
  { barcode: "8719200257122", name: "Margarina de mesa 240 gr", category: "Abastos", purchasePrice: 1.50, stock: 6, expirationDate: "2026-08-04T00:00:00.000Z" },
  { barcode: "7861073101192", name: "Palillos de dientes cj", category: "Abastos", purchasePrice: 0.30, stock: 37, expirationDate: null },
  { barcode: "7862117323358", name: "Galletas salticas 63g", category: "Extra", purchasePrice: 0.50, stock: 4, expirationDate: "2027-01-15T00:00:00.000Z" },
  { barcode: "7861091146366", name: "Galletas Ricas 58g", category: "Extra", purchasePrice: 0.50, stock: 7, expirationDate: "2026-08-07T00:00:00.000Z" },
  { barcode: "7861091196743", name: "Galletas María 172g", category: "Extra", purchasePrice: 1.30, stock: 4, expirationDate: "2026-11-27T00:00:00.000Z" },
  { barcode: "7622202217531", name: "Galletas Oreo 135 g", category: "Extra", purchasePrice: 1.20, stock: 4, expirationDate: "2027-02-07T00:00:00.000Z" },
  { barcode: "7622202027925", name: "Galletas Ritz 240 g", category: "Extra", purchasePrice: 2.40, stock: 1, expirationDate: "2026-08-06T00:00:00.000Z" },
  { barcode: "7861001232011", name: "Coffee Mate 300 gr", category: "Extra", purchasePrice: 5.20, stock: 5, expirationDate: "2026-12-08T00:00:00.000Z" },
  { barcode: "7891000333570", name: "Café Nescafé 160gr", category: "Abastos", purchasePrice: 9.65, stock: 34, expirationDate: "2027-04-30T00:00:00.000Z" },
  { barcode: "02", name: "Huevos cub", category: "Abastos", purchasePrice: 3.35, stock: 13, expirationDate: null },
  { barcode: "7861007905414", name: "Salsa China Galón", category: "Abastos", purchasePrice: 7.65, stock: 1, expirationDate: "2027-02-23T00:00:00.000Z" },
  { barcode: "7862128052506", name: "Vinagre blanco Galón", category: "Abastos", purchasePrice: 2.70, stock: 2, expirationDate: "2027-02-26T00:00:00.000Z" },
  { barcode: "7862100730804", name: "Mayonesa Galón", category: "Abastos", purchasePrice: 16.75, stock: 1, expirationDate: "2026-06-15T00:00:00.000Z" },
  { barcode: "7861001267129", name: "Mostaza Galón", category: "Abastos", purchasePrice: 15.61, stock: 1, expirationDate: "2027-01-28T00:00:00.000Z" }
];

async function importPhase2() {
  try {
    console.log('--- Importing Phase 2 (Internal Consumption) ---');
    for (const p of products) {
      const existing = await prisma.product.findUnique({ where: { barcode: p.barcode } });
      const data = { ...p, salePrice: p.purchasePrice, isSellable: false };
      if (existing) {
        console.log(`Updating existing product: ${p.name}`);
        await prisma.product.update({ where: { barcode: p.barcode }, data });
      } else {
        console.log(`Creating new product: ${p.name}`);
        await prisma.product.create({ data });
      }
    }
    console.log('--- PHASE 2 COMPLETE ---');
  } catch (error) {
    console.error('Error in phase 2 import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importPhase2();
