// Quick script to check database tables and migrate stages
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // List all tables
  console.log('Listing tables...');
  const tables = await prisma.$queryRaw<{tablename: string}[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  `;
  console.log('Tables:', tables.map(t => t.tablename));

  // Check if Feature table exists
  const hasFeatureTable = tables.some(t => t.tablename === 'Feature' || t.tablename === 'features');
  console.log('\nHas Feature table:', hasFeatureTable);

  if (hasFeatureTable) {
    // Try to migrate - use lowercase table name
    console.log('\nRunning migration...');
    try {
      const specifyResult = await prisma.$executeRaw`
        UPDATE features SET stage = 'specs' WHERE stage = 'specify'
      `;
      console.log(`Updated ${specifyResult} from 'specify' to 'specs'`);

      const clarifyResult = await prisma.$executeRaw`
        UPDATE features SET stage = 'specs' WHERE stage = 'clarify'
      `;
      console.log(`Updated ${clarifyResult} from 'clarify' to 'specs'`);

      // Migrate 'checklist' -> 'plan'
      const checklistResult = await prisma.$executeRaw`
        UPDATE features SET stage = 'plan' WHERE stage = 'checklist'
      `;
      console.log(`Updated ${checklistResult} from 'checklist' to 'plan'`);

      // Migrate 'analyze' -> 'tasks' (merged into tasks stage)
      const analyzeResult = await prisma.$executeRaw`
        UPDATE features SET stage = 'tasks' WHERE stage = 'analyze'
      `;
      console.log(`Updated ${analyzeResult} from 'analyze' to 'tasks'`);

      // Show current distribution
      const stages = await prisma.$queryRaw<{stage: string, count: bigint}[]>`
        SELECT stage, COUNT(*) as count FROM features GROUP BY stage
      `;
      console.log('\nCurrent stage distribution:');
      for (const row of stages) {
        console.log(`  ${row.stage}: ${row.count}`);
      }
    } catch (e) {
      console.log('Migration error:', e);
    }
  }
}

main()
  .finally(() => prisma.$disconnect());
