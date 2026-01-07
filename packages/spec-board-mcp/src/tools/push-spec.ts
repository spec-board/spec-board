/**
 * push_spec tool - Upload local specs to SpecBoard cloud
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getApiConfig, uploadSpecs, type CloudSpec } from '../api/client.js';

export interface PushSpecResult {
  success: boolean;
  message: string;
  pushedFeatures: string[];
  filesUploaded: number;
}

const SPEC_FILE_TYPES = ['spec', 'plan', 'tasks'] as const;

export async function pushSpec(
  projectPath: string,
  cloudProjectId: string,
  featureId?: string
): Promise<PushSpecResult> {
  // Validate project path exists
  const specsDir = path.join(projectPath, 'specs');
  try {
    await fs.access(specsDir);
  } catch {
    throw new Error(`Specs directory does not exist: ${specsDir}`);
  }

  // Get API config
  const config = getApiConfig();

  // Read local specs
  const specs: CloudSpec[] = [];
  let filesRead = 0;

  if (featureId) {
    // Read specific feature
    const spec = await readFeatureSpec(specsDir, featureId);
    if (spec) {
      specs.push(spec);
      filesRead += spec.files.length;
    }
  } else {
    // Read all features
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const spec = await readFeatureSpec(specsDir, entry.name);
        if (spec) {
          specs.push(spec);
          filesRead += spec.files.length;
        }
      }
    }
  }

  if (specs.length === 0) {
    return {
      success: true,
      message: featureId
        ? `No spec files found for feature '${featureId}'`
        : 'No spec files found in project',
      pushedFeatures: [],
      filesUploaded: 0,
    };
  }

  // Upload to cloud
  const result = await uploadSpecs(config, cloudProjectId, specs);

  return {
    success: result.success,
    message: result.message,
    pushedFeatures: result.syncedFeatures,
    filesUploaded: filesRead,
  };
}

async function readFeatureSpec(specsDir: string, featureId: string): Promise<CloudSpec | null> {
  const featureDir = path.join(specsDir, featureId);

  try {
    await fs.access(featureDir);
  } catch {
    return null;
  }

  const files: CloudSpec['files'] = [];

  for (const type of SPEC_FILE_TYPES) {
    const filePath = path.join(featureDir, `${type}.md`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      files.push({
        type,
        content,
        lastModified: stats.mtime.toISOString(),
      });
    } catch {
      // File doesn't exist, skip
    }
  }

  if (files.length === 0) {
    return null;
  }

  return {
    featureId,
    featureName: featureId, // Could be enhanced to parse from spec.md
    files,
  };
}
