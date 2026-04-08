const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'asc' }
    });
    
    console.log(`Total Expenses: ${expenses.length}`);
    for (const exp of expenses) {
        console.log(`Date: ${exp.date.toISOString().split('T')[0]}, Amount: ${exp.amount}, Method: ${exp.paymentMethod}, Desc: ${exp.description}`);
    }
}

test().catch(console.error).finally(() => prisma.$disconnect());
