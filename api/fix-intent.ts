import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIntent() {
  const intent = await prisma.intent.findFirst({
    where: { id: 'd241b081-b569-44f3-b90a-2f8b798038d8' }
  });

  if (intent) {
    console.log('Current intent:', {
      id: intent.id,
      quoteId: intent.quoteId,
      intentHash: intent.intentHash,
      status: intent.status
    });

    // This intent is from our old test - it's using wrong format
    // Let's mark it as failed so worker stops checking it
    await prisma.intent.update({
      where: { id: intent.id },
      data: {
        status: 'failed',
        errorMessage: 'Old test intent - incorrect deposit address format'
      }
    });

    console.log('✅ Marked old test intent as failed');
  }
}

fixIntent()
  .then(() => prisma.$disconnect())
  .catch(console.error);
