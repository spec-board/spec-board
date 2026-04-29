'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Plus, Trash2, Save } from 'lucide-react';
import { useMindMapStore } from './mind-map-store';

const NODE_COLORS = ['#f6ad55', '#68d391', '#63b3ed', '#fc8181', '#b794f4', '#f687b3'];

export function MindMapToolbar() {
  const addNode = useMindMapStore((s) => s.addNode);
  const deleteNode = useMindMapStore((s) => s.deleteNode);
  const updateNodeColor = useMindMapStore((s) => s.updateNodeColor);
  const saveToServer = useMindMapStore((s) => s.saveToServer);
  const isSaving = useMindMapStore((s) => s.isSaving);
  const selectedNode = useMindMapStore((s) => s.nodes.find((n) => n.selected));
  const { screenToFlowPosition } = useReactFlow();

  const handleAddNode = useCallback(() => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(position);
  }, [addNode, screenToFlowPosition]);

  const handleDelete = useCallback(() => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
    }
  }, [selectedNode, deleteNode]);

  const handleColorChange = useCallback(
    (color: string) => {
      if (selectedNode) {
        updateNodeColor(selectedNode.id, color);
      }
    },
    [selectedNode, updateNodeColor]
  );

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
          disabled={!selectedNode}
          title="Delete selected"
        >
          <Trash2 className="w-4 h-4" />
        </button>

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
