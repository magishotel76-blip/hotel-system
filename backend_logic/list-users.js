const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true }
    });
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-------------------------');
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
