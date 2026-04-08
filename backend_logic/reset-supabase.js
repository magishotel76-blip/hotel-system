const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Tumiprincesa123.@db.lipunwklqeqvblbvjofo.supabase.co:5432/postgres"
    }
  }
});

async function main() {
  try {
    console.log('Limpiando base de datos para restauración...');
    // Drop all tables in public schema
    await prisma.$executeRawUnsafe(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log('Base de datos limpia.');
  } catch (e) {
    console.error('Error al limpiar:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
