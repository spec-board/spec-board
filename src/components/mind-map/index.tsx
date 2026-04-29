'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  type NodeOrigin,
  type OnConnectStart,
  type OnConnectEnd,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useMindMapStore } from './mind-map-store';
import { MindMapNode } from './mind-map-node';
import { MindMapEdge } from './mind-map-edge';
import { MindMapToolbar } from './mind-map-toolbar';
import type { MindMapFlowNode, MindMapFlowEdge } from './types';

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };
const nodeOrigin: NodeOrigin = [0.5, 0.5];

interface MindMapCanvasProps {
  projectSlug: string;
}

function MindMapCanvas({ projectSlug }: MindMapCanvasProps) {
  const {
    nodes,
    edges,
    isLoading,
    isSaving,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    loadFromServer,
  } = useMindMapStore();

  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  useEffect(() => {
    loadFromServer(projectSlug);
  }, [projectSlug, loadFromServer]);

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const target = event.target as Element;
      const targetIsPane = target.classList.contains('react-flow__pane');

      if (targetIsPane && connectingNodeId.current) {
        const position = screenToFlowPosition({
          x: (event as MouseEvent).clientX,
          y: (event as MouseEvent).clientY,
        });
        addNode(position, connectingNodeId.current);
      }

      connectingNodeId.current = null;
    },
    [screenToFlowPosition, addNode]
  );

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(position);
    },
    [screenToFlowPosition, addNode]
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
        Loading mind map...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow<MindMapFlowNode, MindMapFlowEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onPaneClick={undefined}
        onDoubleClick={handlePaneDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={nodeOrigin}
        fitView
        deleteKeyCode="Delete"
        className="bg-[var(--background)]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
        <MindMapToolbar />
        {isSaving && (
          <Panel position="bottom-right">
            <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function MindMapView({ projectSlug }: { projectSlug: string }) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas projectSlug={projectSlug} />
    </ReactFlowProvider>
  );
}
