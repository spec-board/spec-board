import type { Node, Edge } from '@xyflow/react';

export interface MindMapNodeProps {
  id: string;
  data: {
    label: string;
    color: string;
    type: string;
  };
  selected?: boolean;
}

export type MindMapFlowNode = Node<{ label: string; color: string; type: string }>;
export type MindMapFlowEdge = Edge<{ label?: string }>;

export interface CreateNodePayload {
  label?: string;
  color?: string;
  positionX: number;
  positionY: number;
  parentId?: string;
  type?: string;
}

export interface UpdateNodePayload {
  label?: string;
  color?: string;
  positionX?: number;
  positionY?: number;
  type?: string;
}

export interface CreateEdgePayload {
  sourceId: string;
  targetId: string;
  label?: string;
  type?: string;
}
