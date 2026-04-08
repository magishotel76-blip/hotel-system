const { PrismaClient } = require('@prisma/client');

// Use the pooler port (6543) in production if the direct port (5432) is detected
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes(':5432/') && !dbUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
  console.log('🔄 Adjusting DB port for production (5432 -> 6543 with pgbouncer)');
  dbUrl = dbUrl.replace(':5432/', ':6543/') + (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

module.exports = prisma;
