const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find the room
  const room = await prisma.room.findFirst({
    where: { roomNumber: { contains: '8' } }
  });
  
  if (!room) {
    console.log('Room not found');
    return;
  }
  console.log(`Found Room: ${room.roomNumber} (ID: ${room.id})`);

  // 2. Find the latest reservation for this room
  const reservation = await prisma.reservation.findFirst({
    where: { roomId: room.id },
    orderBy: { createdAt: 'desc' },
    include: { invoices: true, customer: true }
  });

  if (!reservation) {
    console.log('No reservation found for this room');
    return;
  }
  console.log(`Found Reservation for ${reservation.customer?.name} (Status: ${reservation.status})`);

  if (reservation.invoices && reservation.invoices.length > 0) {
    // 3. Revert latest invoice status to 'borrador'
    const latestInvoice = reservation.invoices[reservation.invoices.length - 1];
    const updatedInvoice = await prisma.invoice.update({
      where: { id: latestInvoice.id },
      data: { status: 'borrador' }
    });
    console.log(`Updated Invoice ${updatedInvoice.id} to status: borrador`);
  } else {
    console.log('No invoices associated with this reservation');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
