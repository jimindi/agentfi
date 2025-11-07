const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create system user
  const user = await prisma.user.upsert({
    where: { email: 'system@agentfi.io' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'system@agentfi.io',
      companyName: 'AgentFi System',
      planTier: 'enterprise',
    },
  });

  console.log('✅ System user created:', user.id);

  // Create system API key
  const apiKey = await prisma.apiKey.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      userId: user.id,
      keyHash: 'system',
      keyPrefix: 'sk_system',
      name: 'System API Key',
      rateLimitPerHour: 999999,
      isActive: true,
    },
  });

  console.log('✅ System API key created:', apiKey.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
