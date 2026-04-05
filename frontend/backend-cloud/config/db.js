const { PrismaClient } = require('@prisma/client');

// Forzar el uso del pooler (6543) en producción si se detecta el puerto directo (5432)
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes(':5432/') && !dbUrl.includes('localhost')) {
  console.log('🔄 Corrigiendo puerto de base de datos para entorno cloud (5432 -> 6543)');
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
