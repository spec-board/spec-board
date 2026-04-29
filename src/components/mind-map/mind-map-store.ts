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
  saveError: string | null;

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

function uid() {
  return crypto.randomUUID();
}

export const useMindMapStore = create<MindMapStore>((set, get) => {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  function cancelPendingSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  }

  function debouncedSave() {
    cancelPendingSave();
    saveTimeout = setTimeout(() => {
      get().saveToServer();
    }, 1500);
  }

  return {
    nodes: [],
    edges: [],
    projectSlug: null,
    isLoading: false,
    isSaving: false,
    saveError: null,

    setProjectSlug: (slug) => set({ projectSlug: slug }),

    setNodes: (nodes) => set({ nodes }),

    setEdges: (edges) => set({ edges }),

    onNodesChange: (changes) => {
      set({ nodes: applyNodeChanges(changes, get().nodes) });
      const isDragging = changes.some(
        (c) => c.type === 'position' && 'dragging' in c && c.dragging
      );
      if (!isDragging) debouncedSave();
    },

    onEdgesChange: (changes) => {
      set({ edges: applyEdgeChanges(changes, get().edges) });
      debouncedSave();
    },

    onConnect: (connection) => {
      const { edges } = get();
      if (!connection.source || !connection.target) return;
      const exists = edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) return;

      const newEdge: MindMapFlowEdge = {
        id: uid(),
        source: connection.source,
        target: connection.target,
        type: 'mindmap',
      };
      set({ edges: [...edges, newEdge] });
      debouncedSave();
    },

    addNode: (position, parentId) => {
      const { nodes } = get();
      const newNode: MindMapFlowNode = {
        id: uid(),
        type: 'mindmap',
        position,
        data: { label: 'New Idea', color: '#f6ad55', type: 'default' },
      };
      set({ nodes: [...nodes, newNode] });

      if (parentId) {
        const { edges } = get();
        const newEdge: MindMapFlowEdge = {
          id: uid(),
          source: parentId,
          target: newNode.id,
          type: 'mindmap',
        };
        set({ edges: [...edges, newEdge] });
      }
      debouncedSave();
    },

    updateNodeLabel: (nodeId, label) => {
      set({
        nodes: get().nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
        ),
      });
      debouncedSave();
    },

    updateNodeColor: (nodeId, color) => {
      set({
        nodes: get().nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, color } } : node
        ),
      });
      debouncedSave();
    },

    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((n) => n.id !== nodeId),
        edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      });
      debouncedSave();
    },

    loadFromServer: async (slug) => {
      cancelPendingSave();
      set({ isLoading: true, projectSlug: slug, saveError: null });
      try {
        const res = await fetch(`/api/projects/${slug}/mind-map`);
        if (!res.ok) {
          set({ nodes: [], edges: [], isLoading: false });
          return;
        }
        const data = await res.json();

        const nodes: MindMapFlowNode[] = (data.nodes || []).map((n: { id: string; positionX: number; positionY: number; label: string; color: string; type: string }) => ({
          id: n.id,
          type: 'mindmap' as const,
          position: { x: n.positionX, y: n.positionY },
          data: { label: n.label, color: n.color, type: n.type },
        }));

        const edges: MindMapFlowEdge[] = (data.edges || []).map((e: { id: string; sourceId: string; targetId: string; label?: string }) => ({
          id: e.id,
          source: e.sourceId,
          target: e.targetId,
          type: 'mindmap' as const,
        }));

        set({ nodes, edges, isLoading: false });
      } catch {
        set({ nodes: [], edges: [], isLoading: false });
      }
    },

    saveToServer: async () => {
      const { nodes, edges, projectSlug } = get();
      if (!projectSlug) return;

      set({ isSaving: true, saveError: null });
      try {
        const res = await fetch(`/api/projects/${projectSlug}/mind-map`, {
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
            })),
          }),
        });
        if (!res.ok) {
          set({ saveError: 'Failed to save mind map' });
        }
      } catch {
        set({ saveError: 'Failed to save mind map' });
      } finally {
        set({ isSaving: false });
      }
    },
  };
});
