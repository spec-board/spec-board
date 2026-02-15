// API client for database-driven features
import type { Feature, UserStory, Task } from '@/types';

const API_BASE = '/api';

export interface KanbanData {
  backlog: Feature[];
  planning: Feature[];
  in_progress: Feature[];
  done: Feature[];
}

// Feature API
export async function fetchFeatures(projectId: string): Promise<Feature[]> {
  const res = await fetch(`${API_BASE}/features?projectId=${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch features');
  return res.json();
}

export async function fetchFeature(id: string): Promise<Feature> {
  const res = await fetch(`${API_BASE}/features/${id}`);
  if (!res.ok) throw new Error('Failed to fetch feature');
  return res.json();
}

export async function createFeature(data: {
  projectId: string;
  featureId: string;
  name: string;
  description?: string;
  stage?: string;
  status?: string;
  order?: number;
}): Promise<Feature> {
  const res = await fetch(`${API_BASE}/features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create feature');
  return res.json();
}

export async function updateFeature(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    stage: string;
    status: string;
    order: number;
  }>
): Promise<Feature> {
  const res = await fetch(`${API_BASE}/features/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update feature');
  return res.json();
}

export async function deleteFeature(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/features/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete feature');
}

// Kanban API
export async function fetchKanban(projectId: string): Promise<KanbanData> {
  const res = await fetch(`${API_BASE}/kanban?projectId=${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch kanban');
  return res.json();
}

// User Story API
export async function fetchStories(featureId: string): Promise<UserStory[]> {
  const res = await fetch(`${API_BASE}/stories?featureId=${featureId}`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export async function createStory(data: {
  featureId: string;
  storyId: string;
  title: string;
  description?: string;
  status?: string;
  order?: number;
}): Promise<UserStory> {
  const res = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create story');
  return res.json();
}

// Task API
export async function fetchTasks(featureId?: string, userStoryId?: string): Promise<Task[]> {
  const params = new URLSearchParams();
  if (featureId) params.set('featureId', featureId);
  if (userStoryId) params.set('userStoryId', userStoryId);

  const res = await fetch(`${API_BASE}/tasks?${params}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(data: {
  featureId: string;
  userStoryId?: string;
  taskId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  order?: number;
}): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    order: number;
  }>
): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
}
