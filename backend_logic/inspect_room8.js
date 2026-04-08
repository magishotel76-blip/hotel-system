const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectRoom8() {
  const room = await prisma.room.findFirst({
    where: { roomNumber: '8' }
  });
  if (!room) {
    console.log("Room 8 not found");
    return;
  }
  
  // Find reservations for this room, especially recent completed ones
  const res = await prisma.reservation.findMany({
    where: { roomId: room.id },
    orderBy: { checkOutDate: 'desc' },
    take: 5,
    include: {
      invoices: true,
      customer: true
    }
  });
  
  console.log(JSON.stringify(res, null, 2));
}

inspectRoom8().finally(() => prisma.$disconnect());
