const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const intents = await prisma.intent.findMany({
    where: {
      status: 'completed',
      createdAt: {
        gte: new Date('2025-11-07'),
        lte: new Date('2025-11-08')
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Successful swaps from Nov 7:');
  console.log(JSON.stringify(intents, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
