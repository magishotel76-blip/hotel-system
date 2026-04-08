const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:Tumiprincesa123.@db.lipunwklqeqvblbvjofo.supabase.co:5432/postgres"
      }
    }
  });

  try {
    console.log('Testing direct connection to port 5432...');
    const users = await prisma.user.findMany({ select: { id: true }, take: 1 });
    console.log('SUCCESS!');
  } catch (err) {
    console.error('FAILED direct connection to 5432:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
