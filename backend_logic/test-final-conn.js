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
    console.log('Probando conexión final a Supabase...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ Conexión EXITOSA. Usuario encontrado:', users[0].email);
  } catch (e) {
    console.error('❌ Error de conexión:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
