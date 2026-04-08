const prisma = require('./config/db');
const bcrypt = require('bcryptjs');

async function main() {
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
        name: 'Administrador Test',
        role: 'ADMIN'
      }
    });
    console.log('--- TEST USER CREATED/UPDATED ---');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('---------------------------------');
  } catch (err) {
    console.error('Error creating user:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
