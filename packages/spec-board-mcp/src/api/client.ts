/**
 * API client for communicating with SpecBoard cloud
 */

export interface ApiConfig {
  baseUrl: string;
  apiToken: string;
}

export interface CloudSpec {
  featureId: string;
  featureName: string;
  files: {
    type: 'spec' | 'plan' | 'tasks';
    content: string;
    lastModified: string;
    lastModifiedBy?: string;
  }[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  syncedFeatures: string[];
  errors?: string[];
}

// Get config from environment variables
export function getApiConfig(): ApiConfig {
  const baseUrl = process.env.SPEC_BOARD_API_URL || 'https://spec-board.app/api';
  const apiToken = process.env.SPEC_BOARD_API_TOKEN || '';

  if (!apiToken) {
    throw new Error(
      'SPEC_BOARD_API_TOKEN environment variable is required. ' +
      'Generate a token from your SpecBoard dashboard at https://spec-board.app/settings/tokens'
    );
  }

  return { baseUrl, apiToken };
}

// Fetch specs from cloud
export async function fetchCloudSpecs(
  config: ApiConfig,
  cloudProjectId: string,
  featureId?: string
): Promise<CloudSpec[]> {
  const url = featureId
    ? `${config.baseUrl}/sync/${cloudProjectId}/features/${featureId}`
    : `${config.baseUrl}/sync/${cloudProjectId}/features`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch specs from cloud: ${response.status} ${error}`);
  }

  return response.json();
}

// Upload specs to cloud
export async function uploadSpecs(
  config: ApiConfig,
  cloudProjectId: string,
  specs: CloudSpec[]
): Promise<SyncResult> {
  const response = await fetch(`${config.baseUrl}/sync/${cloudProjectId}/push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ specs }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload specs to cloud: ${response.status} ${error}`);
  }

  return response.json();
}
