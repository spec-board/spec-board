/**
 * pull_spec tool - Download specs from SpecBoard cloud to local
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getApiConfig, fetchCloudSpecs, type CloudSpec } from '../api/client.js';

export interface PullSpecResult {
  success: boolean;
  message: string;
  pulledFeatures: string[];
  filesWritten: number;
}

export async function pullSpec(
  projectPath: string,
  cloudProjectId: string,
  featureId?: string
): Promise<PullSpecResult> {
  // Validate project path exists
  try {
    await fs.access(projectPath);
  } catch {
    throw new Error(`Project path does not exist: ${projectPath}`);
  }

  // Get API config
  const config = getApiConfig();

  // Fetch specs from cloud
  const cloudSpecs = await fetchCloudSpecs(config, cloudProjectId, featureId);

  if (cloudSpecs.length === 0) {
    return {
      success: true,
      message: featureId
        ? `No specs found for feature '${featureId}' in cloud project`
        : 'No specs found in cloud project',
      pulledFeatures: [],
      filesWritten: 0,
    };
  }

  // Write specs to local filesystem
  const specsDir = path.join(projectPath, 'specs');
  await fs.mkdir(specsDir, { recursive: true });

  let filesWritten = 0;
  const pulledFeatures: string[] = [];

  for (const spec of cloudSpecs) {
    const featureDir = path.join(specsDir, spec.featureId);
    await fs.mkdir(featureDir, { recursive: true });

    for (const file of spec.files) {
      const filename = `${file.type}.md`;
      const filePath = path.join(featureDir, filename);
      await fs.writeFile(filePath, file.content, 'utf-8');
      filesWritten++;
    }

    pulledFeatures.push(spec.featureId);
  }

  return {
    success: true,
    message: `Successfully pulled ${pulledFeatures.length} feature(s) from cloud`,
    pulledFeatures,
    filesWritten,
  };
}
