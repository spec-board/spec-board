'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useMindMapStore } from './mind-map-store';

function MindMapNodeComponent({ id, data, selected }: NodeProps & { data: { label: string; color: string; type: string } }) {
  const updateNodeLabel = useMindMapStore((s) => s.updateNodeLabel);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    },
    []
  );

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 shadow-sm min-w-[100px] text-center transition-all ${
        selected ? 'border-[var(--ring)] shadow-md' : 'border-transparent'
      }`}
      style={{ backgroundColor: data.color }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[var(--muted-foreground)]" />

      {isEditing ? (
        <input
          ref={inputRef}
          value={data.label}
          onChange={(e) => updateNodeLabel(id, e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-center text-sm font-medium w-full text-gray-900"
        />
      ) : (
        <span className="text-sm font-medium text-gray-900 select-none">
          {data.label}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[var(--muted-foreground)]" />
    </div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
