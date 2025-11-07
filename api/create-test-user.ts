import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@agentfi.io',
        companyName: 'AgentFi Test',
        planTier: 'developer'
      }
    });

    console.log('✅ Created test user:', user.id);

    // Create test API key
    const apiKey = 'sk_test_' + Math.random().toString(36).substring(2, 15);
    const keyHash = await bcrypt.hash(apiKey, 12);

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId: user.id,
        keyHash: keyHash,
        keyPrefix: apiKey.substring(0, 12),
        name: 'Test API Key',
        rateLimitPerHour: 10000
      }
    });

    console.log('✅ Created API key:', apiKeyRecord.id);
    console.log('📝 API Key:', apiKey);
    
    console.log('\n🎯 Use these IDs for testing:');
    console.log('userId:', user.id);
    console.log('apiKeyId:', apiKeyRecord.id);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTestUser();
