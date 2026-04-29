'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Plus, Trash2, Save, Sparkles } from 'lucide-react';
import { useMindMapStore } from './mind-map-store';
import { toast } from 'sonner';

const NODE_COLORS = ['#f6ad55', '#68d391', '#63b3ed', '#fc8181', '#b794f4', '#f687b3'];

export function MindMapToolbar() {
  const addNode = useMindMapStore((s) => s.addNode);
  const deleteNode = useMindMapStore((s) => s.deleteNode);
  const updateNodeColor = useMindMapStore((s) => s.updateNodeColor);
  const saveToServer = useMindMapStore((s) => s.saveToServer);
  const convertToFeature = useMindMapStore((s) => s.convertToFeature);
  const convertGroupToFeature = useMindMapStore((s) => s.convertGroupToFeature);
  const isSaving = useMindMapStore((s) => s.isSaving);
  const projectId = useMindMapStore((s) => s.projectId);
  const selectedNodes = useMindMapStore((s) => s.nodes.filter((n) => n.selected));
  const { screenToFlowPosition } = useReactFlow();

  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const hasSelection = selectedNodes.length > 0;
  const canConvert = hasSelection && selectedNodes.some((n) => n.data.type !== 'feature') && !!projectId;

  const handleAddNode = useCallback(() => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(position);
  }, [addNode, screenToFlowPosition]);

  const handleDelete = useCallback(() => {
    for (const node of selectedNodes) {
      deleteNode(node.id);
    }
  }, [selectedNodes, deleteNode]);

  const handleColorChange = useCallback(
    (color: string) => {
      for (const node of selectedNodes) {
        updateNodeColor(node.id, color);
      }
    },
    [selectedNodes, updateNodeColor]
  );

  const handleConvert = useCallback(async () => {
    if (!canConvert) return;

    const convertibleNodes = selectedNodes.filter((n) => n.data.type !== 'feature');
    let success: boolean;

    if (convertibleNodes.length === 1) {
      success = await convertToFeature(convertibleNodes[0].id);
    } else {
      success = await convertGroupToFeature(convertibleNodes.map((n) => n.id));
    }

    if (success) {
      toast.success('Feature created from mind map');
    } else {
      toast.error('Failed to create feature');
    }
  }, [canConvert, selectedNodes, convertToFeature, convertGroupToFeature]);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-1.5 shadow-sm">
        <button
          onClick={handleAddNode}
          className="btn-icon"
          title="Add node"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleDelete}
          className="btn-icon"
          disabled={!hasSelection}
          title="Delete selected"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {canConvert && (
          <>
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <button
              onClick={handleConvert}
              className="btn-icon"
              title={selectedNodes.length > 1 ? 'Convert group to feature' : 'Convert to feature'}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        <button
          onClick={saveToServer}
          className="btn-icon"
          disabled={isSaving}
          title="Save"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {selectedNode && (
        <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-1.5 shadow-sm">
          {NODE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className="w-5 h-5 rounded-full border border-[var(--border)] transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
