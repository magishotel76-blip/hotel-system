const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Tumiprincesa123.@db.azadnxpnubgcmufmdvic.supabase.co:5432/postgres"
    }
  }
});

async function main() {
  try {
    console.log('Intentando conectar a Supabase...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Conexión exitosa. Usuarios encontrados:', users.length);
  } catch (e) {
    console.error('Error de conexión:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
