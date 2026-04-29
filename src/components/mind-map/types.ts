import type { Node, Edge } from '@xyflow/react';

export type MindMapFlowNode = Node<{ label: string; color: string; type: string }>;
export type MindMapFlowEdge = Edge<{ label?: string }>;
