const prisma = require('./config/db');

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true }
    });
    console.log('--- USERS IN DATABASE ---');
    console.log(users);
    console.log('-------------------------');
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
