import { rmSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const projectRoot = '/vercel/share/v0-project';
const slugDir = join(projectRoot, 'src/app/api/projects/[slug]');

console.log('Checking for [slug] directory...');
console.log('Exists:', existsSync(slugDir));

if (existsSync(slugDir)) {
  try {
    const contents = readdirSync(slugDir);
    console.log('Contents:', contents);
  } catch (e) {
    console.log('Cannot read contents:', e.message);
  }
  
  try {
    rmSync(slugDir, { recursive: true, force: true });
    console.log('Successfully removed [slug] directory');
  } catch (e) {
    console.log('Failed to remove:', e.message);
  }
} else {
  console.log('[slug] directory does not exist on filesystem');
}

// Also check parent for any stale dirs
const projectsApiDir = join(projectRoot, 'src/app/api/projects');
if (existsSync(projectsApiDir)) {
  const entries = readdirSync(projectsApiDir, { withFileTypes: true });
  console.log('\nContents of src/app/api/projects/:');
  entries.forEach(e => {
    console.log(`  ${e.isDirectory() ? '[DIR]' : '[FILE]'} ${e.name}`);
  });
}
