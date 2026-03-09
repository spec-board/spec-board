// Event types
export interface JobCompleteEvent {
  featureId: string;
  stage: string;
  status: 'completed' | 'failed';
  error?: string;
}

// Publish job complete event (called from worker)
// NOTE: Real-time updates disabled - user manually refreshes (F5) after job completes
export function emitJobComplete(_event: JobCompleteEvent) {
  // No-op: Real-time updates removed. User manually refreshes after job completes.
}
