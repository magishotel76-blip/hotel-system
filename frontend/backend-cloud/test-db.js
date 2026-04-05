const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users);
  
  if (users.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@hotel.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Created admin:', admin);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
