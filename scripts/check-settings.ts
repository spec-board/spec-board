import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.appSettings.findUnique({
    where: { key: 'app-settings' }
  });

  if (settings) {
    console.log('=== App Settings from DB ===');
    console.log('key:', settings.key);
    console.log('aiProvider:', settings.aiProvider);
    console.log('openaiBaseUrl:', settings.openaiBaseUrl);
    console.log('openaiModel:', settings.openaiModel);
    console.log('openaiApiKey length:', settings.openaiApiKey ? settings.openaiApiKey.length : 'NULL');
    console.log('openaiApiKey (first 10 chars):', settings.openaiApiKey ? settings.openaiApiKey.substring(0, 10) : 'NULL');
  } else {
    console.log('No settings found!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
