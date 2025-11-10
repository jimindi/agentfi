const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const keys = await prisma.apiKey.findMany({
    include: { user: true }
  });
  console.log('API Keys:', JSON.stringify(keys, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
