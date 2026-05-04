import type { Node, Edge } from '@xyflow/react';

export type MindMapFlowNode = Node<{ label: string; color: string; type: string; featureId?: string }>;
export type MindMapFlowEdge = Edge<{ label?: string }>;
