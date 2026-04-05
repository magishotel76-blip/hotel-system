const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.customer.create({
    data: {
      name: 'RS ROT',
      document: '1792123456001',
      clientType: 'EMPRESA',
      companyIndividualPrice: 35.0,
      companySharedPrice: 25.0,
      address: 'Quito, Ecuador',
      phone: '0999999999'
    }
  });
  console.log('Company created:', company);

  const employee = await prisma.customer.create({
    data: {
      name: 'JUAN PEREZ (RS ROT)',
      document: '1722883344',
      clientType: 'NATURAL',
      companyId: company.id
    }
  });
  console.log('Employee created:', employee);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
