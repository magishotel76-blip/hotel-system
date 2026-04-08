const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:Tumiprincesa123.@db.lipunwklqeqvblbvjofo.supabase.co:5432/postgres"
      }
    }
  });

  const email = 'admin@hotel.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        password: hashedPassword,
        name: 'Admin Hotel',
        role: 'ADMIN'
      }
    });
    console.log('SUCCESS: User admin@hotel.com / admin123 created/updated.');
  } catch (err) {
    console.error('FAILED to create user:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
