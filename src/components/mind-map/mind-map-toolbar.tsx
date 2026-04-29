'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Plus, Trash2, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { MindMapFlowNode, MindMapFlowEdge } from './types';

const NODE_COLORS = ['#f6ad55', '#68d391', '#63b3ed', '#fc8181', '#b794f4', '#f687b3'];

interface MindMapToolbarProps {
  nodes: MindMapFlowNode[];
  setNodes: Dispatch<SetStateAction<MindMapFlowNode[]>>;
  edges: MindMapFlowEdge[];
  setEdges: Dispatch<SetStateAction<MindMapFlowEdge[]>>;
  projectId: string | null;
  addNode: (position: { x: number; y: number }) => void;
  saveToServer: () => void;
  isSaving: boolean;
}

export function MindMapToolbar({ nodes, setNodes, edges, setEdges, projectId, addNode, saveToServer, isSaving }: MindMapToolbarProps) {
  const { screenToFlowPosition } = useReactFlow();

  const selectedNodes = nodes.filter(n => n.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const hasSelection = selectedNodes.length > 0;
  const canConvert = hasSelection && selectedNodes.some(n => n.data.type !== 'feature') && !!projectId;

  const handleAddNode = useCallback(() => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(position);
  }, [addNode, screenToFlowPosition]);

  const handleDelete = useCallback(() => {
    const ids = new Set(selectedNodes.map(n => n.id));
    setNodes(nds => nds.filter(n => !ids.has(n.id)));
    setEdges(eds => eds.filter(e => !ids.has(e.source) && !ids.has(e.target)));
  }, [selectedNodes, setNodes, setEdges]);

  const handleColorChange = useCallback((color: string) => {
    const ids = new Set(selectedNodes.map(n => n.id));
    setNodes(nds => nds.map(n => ids.has(n.id) ? { ...n, data: { ...n.data, color } } : n));
  }, [selectedNodes, setNodes]);

  const handleConvert = useCallback(async () => {
    if (!canConvert || !projectId) return;
    const convertible = selectedNodes.filter(n => n.data.type !== 'feature');
    if (convertible.length === 0) return;

    const primary = convertible[0];
    const children = convertible.slice(1);
    const description = children.length > 0
      ? children.map(n => `- ${n.data.label}`).join('\n')
      : primary.data.label;

    try {
      const res = await fetch('/api/features/backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: primary.data.label, description }),
      });
      if (!res.ok) { toast.error('Failed to create feature'); return; }
      const data = await res.json();
      const featureId = data.featureIdDb || data.featureId || data.id;

      const ids = new Set(convertible.map(n => n.id));
      setNodes(nds => nds.map(n => ids.has(n.id) ? { ...n, data: { ...n.data, type: 'feature', featureId } } : n));
      toast.success('Feature created from mind map');
    } catch { toast.error('Failed to create feature'); }
  }, [canConvert, projectId, selectedNodes, setNodes]);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-1.5 shadow-sm">
        <button onClick={handleAddNode} className="btn-icon" title="Add node">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={handleDelete} className="btn-icon" disabled={!hasSelection} title="Delete selected">
          <Trash2 className="w-4 h-4" />
        </button>
        {canConvert && (
          <>
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <button onClick={handleConvert} className="btn-icon" title={selectedNodes.length > 1 ? 'Convert group to feature' : 'Convert to feature'}>
              <Sparkles className="w-4 h-4" />
            </button>
          </>
        )}
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        <button onClick={saveToServer} className="btn-icon" disabled={isSaving} title="Save">
          <Save className="w-4 h-4" />
        </button>
      </div>
      {selectedNode && (
        <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-1.5 shadow-sm">
          {NODE_COLORS.map(color => (
            <button key={color} onClick={() => handleColorChange(color)}
              className="w-5 h-5 rounded-full border border-[var(--border)] transition-transform hover:scale-110"
              style={{ backgroundColor: color }} title={color} />
          ))}
        </div>
      )}
    </div>
  );
}
