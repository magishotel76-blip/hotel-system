const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findV() {
  const custs = await prisma.customer.findMany({
    where: { name: { contains: 'Veron', mode: 'insensitive' } },
    include: {
      reservations: {
        orderBy: { createdAt: 'desc' },
        include: { invoices: true, room: true }
      }
    }
  });
  console.log(JSON.stringify(custs, null, 2));
}

findV().finally(() => prisma.$disconnect());
