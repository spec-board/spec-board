import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Get app info from package.json, README, and CHANGELOG
export async function GET() {
  try {
    const rootDir = process.cwd();

    // Read package.json for version
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Read README.md
    let readme = '';
    const readmePath = path.join(rootDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      readme = fs.readFileSync(readmePath, 'utf-8');
    }

    // Read CHANGELOG.md
    let changelog = '';
    const changelogPath = path.join(rootDir, 'CHANGELOG.md');
    if (fs.existsSync(changelogPath)) {
      changelog = fs.readFileSync(changelogPath, 'utf-8');
    }

    return NextResponse.json({
      name: 'SpecBoard',
      version: packageJson.version,
      description: packageJson.description || 'Visual dashboard for spec-kit projects',
      license: 'AGPL-3.0',
      licenseUrl: 'https://github.com/paulpham157/spec-board/blob/main/LICENSE',
      repository: 'https://github.com/paulpham157/spec-board',
      readme,
      changelog,
    });
  } catch (error) {
    console.error('Error reading app info:', error);
    return NextResponse.json(
      { error: 'Failed to load app info' },
      { status: 500 }
    );
  }
}
