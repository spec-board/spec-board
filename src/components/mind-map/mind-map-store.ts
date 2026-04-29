'use client';

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type XYPosition,
} from '@xyflow/react';
import type { MindMapFlowNode, MindMapFlowEdge } from './types';

interface MindMapStore {
  nodes: MindMapFlowNode[];
  edges: MindMapFlowEdge[];
  projectSlug: string | null;
  isLoading: boolean;
  isSaving: boolean;

  setProjectSlug: (slug: string) => void;
  setNodes: (nodes: MindMapFlowNode[]) => void;
  setEdges: (edges: MindMapFlowEdge[]) => void;
  onNodesChange: (changes: NodeChange<MindMapFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindMapFlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (position: XYPosition, parentId?: string) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeColor: (nodeId: string, color: string) => void;
  deleteNode: (nodeId: string) => void;
  loadFromServer: (slug: string) => Promise<void>;
  saveToServer: () => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMindMapStore = create<MindMapStore>((set, get) => ({
  nodes: [],
  edges: [],
  projectSlug: null,
  isLoading: false,
  isSaving: false,

  setProjectSlug: (slug) => set({ projectSlug: slug }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    debouncedSave(get);
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    debouncedSave(get);
  },

  onConnect: (connection) => {
    const { edges } = get();
    if (!connection.source || !connection.target) return;
    const exists = edges.some(
      (e) => e.source === connection.source && e.target === connection.target
    );
    if (exists) return;

    const newEdge: MindMapFlowEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: 'mindmap',
    };
    set({ edges: [...edges, newEdge] });
    debouncedSave(get);
  },

  addNode: (position, parentId) => {
    const { nodes } = get();
    const newNode: MindMapFlowNode = {
      id: `node-${Date.now()}`,
      type: 'mindmap',
      position,
      data: { label: 'New Idea', color: '#f6ad55', type: 'default' },
    };
    set({ nodes: [...nodes, newNode] });

    if (parentId) {
      const { edges } = get();
      const newEdge: MindMapFlowEdge = {
        id: `edge-${Date.now()}`,
        source: parentId,
        target: newNode.id,
        type: 'mindmap',
      };
      set({ edges: [...edges, newEdge] });
    }
    debouncedSave(get);
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
      ),
    });
    debouncedSave(get);
  },

  updateNodeColor: (nodeId, color) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, color } } : node
      ),
    });
    debouncedSave(get);
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
    debouncedSave(get);
  },

  loadFromServer: async (slug) => {
    set({ isLoading: true, projectSlug: slug });
    try {
      const res = await fetch(`/api/projects/${slug}/mind-map`);
      if (!res.ok) {
        set({ nodes: [], edges: [], isLoading: false });
        return;
      }
      const data = await res.json();

      const nodes: MindMapFlowNode[] = (data.nodes || []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        type: 'mindmap',
        position: { x: n.positionX as number, y: n.positionY as number },
        data: { label: n.label as string, color: n.color as string, type: n.type as string },
      }));

      const edges: MindMapFlowEdge[] = (data.edges || []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        source: e.sourceId as string,
        target: e.targetId as string,
        type: 'mindmap',
        data: { label: e.label as string | undefined },
      }));

      set({ nodes, edges, isLoading: false });
    } catch {
      set({ nodes: [], edges: [], isLoading: false });
    }
  },

  saveToServer: async () => {
    const { nodes, edges, projectSlug } = get();
    if (!projectSlug) return;

    set({ isSaving: true });
    try {
      await fetch(`/api/projects/${projectSlug}/mind-map`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({
            id: n.id,
            label: n.data.label,
            color: n.data.color,
            positionX: n.position.x,
            positionY: n.position.y,
            type: n.data.type,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            sourceId: e.source,
            targetId: e.target,
            label: e.data?.label || null,
          })),
        }),
      });
    } finally {
      set({ isSaving: false });
    }
  },
}));

function debouncedSave(get: () => MindMapStore) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    get().saveToServer();
  }, 1500);
}
