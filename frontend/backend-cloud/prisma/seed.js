const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      email: 'admin@hotel.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user ensured:', admin.email);

  // 2. Room Types
  const simpleType = await prisma.roomType.upsert({
    where: { id: 'type-simple' },
    update: {},
    create: { id: 'type-simple', name: 'Simple', price: 30.0 },
  });
  const sharedType = await prisma.roomType.upsert({
    where: { id: 'type-shared' },
    update: {},
    create: { id: 'type-shared', name: 'Compartida', price: 25.0 },
  });
  console.log('Room types ensured.');

  // 3. 26 Rooms
  for (let i = 1; i <= 26; i++) {
    const roomNumStr = i.toString().padStart(3, '0');
    const isShared = i > 15; // 1-15 simple, 16-26 compartida
    
    // Status initialization: mix them up for visual dashboard testing
    let status = 'disponible';
    if (i === 1 || i === 5) status = 'ocupada';
    if (i === 10) status = 'limpieza';
    if (i === 20) status = 'mantenimiento';

    await prisma.room.upsert({
      where: { roomNumber: roomNumStr },
      update: { status },
      create: {
        roomNumber: roomNumStr,
        roomTypeId: isShared ? sharedType.id : simpleType.id,
        pricePerNight: isShared ? sharedType.price : simpleType.price,
        status,
      },
    });
  }
  console.log('26 Rooms generated.');

  // 4. Products (Ecuadorian Localization)
  const defaultProducts = [
    { name: 'Coca Cola Personal', purchasePrice: 0.50, salePrice: 1.00, stock: 50, category: 'Bebidas' },
    { name: 'Pepsi Personal', purchasePrice: 0.50, salePrice: 1.00, stock: 40, category: 'Bebidas' },
    { name: 'Agua Tesalia', purchasePrice: 0.30, salePrice: 0.80, stock: 100, category: 'Bebidas' },
    { name: 'Agua Güitig', purchasePrice: 0.40, salePrice: 1.00, stock: 60, category: 'Bebidas' },
    { name: 'Cerveza Pilsener', purchasePrice: 1.20, salePrice: 2.50, stock: 120, category: 'Alcohol' },
    { name: 'Cerveza Club', purchasePrice: 1.50, salePrice: 3.00, stock: 80, category: 'Alcohol' },
    { name: 'Jugo del Valle', purchasePrice: 0.60, salePrice: 1.20, stock: 30, category: 'Bebidas' },
    { name: 'Ruffles Natural', purchasePrice: 0.40, salePrice: 1.00, stock: 40, category: 'Snacks' },
    { name: 'Doritos', purchasePrice: 0.45, salePrice: 1.00, stock: 45, category: 'Snacks' },
    { name: 'Galletas Amor', purchasePrice: 0.30, salePrice: 0.60, stock: 50, category: 'Snacks' },
    { name: 'Galletas Oreo', purchasePrice: 0.50, salePrice: 1.00, stock: 30, category: 'Snacks' },
    { name: 'Desayuno Continental', purchasePrice: 2.50, salePrice: 5.39, stock: 999, category: 'Alimentos' },
    { name: 'Almuerzo Ejecutivo', purchasePrice: 3.00, salePrice: 5.39, stock: 999, category: 'Alimentos' },
    { name: 'Merienda Estandar', purchasePrice: 3.00, salePrice: 5.39, stock: 999, category: 'Alimentos' },
    { name: 'Botellón de Agua 20 Lts', purchasePrice: 1.00, salePrice: 1.75, stock: 20, category: 'Bebidas' },
    { name: 'Servicio de Lavandería', purchasePrice: 0.00, salePrice: 2.50, stock: 999, category: 'Servicios' }
  ];

  for (const prod of defaultProducts) {
    // Upsert by name since we don't have a unique strictly required, but let's just create if not exists by manual check
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: prod.name,
          purchasePrice: prod.purchasePrice,
          salePrice: prod.salePrice,
          stock: prod.stock,
          category: prod.category
        }
      });
    }
  }
  console.log('Ecuadorian default products seeded.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
