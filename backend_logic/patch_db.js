const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    // Find the Katmar expense
    const expenses = await prisma.expense.findMany({
        where: {
            description: {
                contains: 'KATMAR'
            }
        }
    });
    
    for (const exp of expenses) {
        if (exp.paymentMethod === 'cash') {
            await prisma.expense.update({
                where: { id: exp.id },
                data: { paymentMethod: 'transfer' }
            });
            console.log(`Updated expense ${exp.id} to transfer`);
        }
    }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
