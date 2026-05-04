'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { Feature, Constitution } from '@/types';
import { calculateImpact, type ImpactSeverity, type ImpactResult } from '@/lib/impact';

const SEVERITY_COLORS: Record<ImpactSeverity, string> = {
  ok: '#22c55e',
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
};

const SEVERITY_BORDER: Record<ImpactSeverity, string> = {
  ok: '2px solid #22c55e',
  info: '2px solid #3b82f6',
  warning: '2px solid #f59e0b',
  critical: '2px solid #ef4444',
};

function buildGraph(feature: Feature, impact: ImpactResult) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const ps = impact.pipelineStatus;

  // Pipeline nodes in a row
  const pipelineNodes = [
    { id: 'spec', label: 'Spec', status: ps.spec, x: 0 },
    { id: 'plan', label: 'Plan', status: ps.plan, x: 220 },
    { id: 'tasks', label: 'Tasks', status: ps.tasks, x: 440 },
    { id: 'analysis', label: 'Analysis', status: ps.analysis, x: 660 },
  ];

  for (const pn of pipelineNodes) {
    nodes.push({
      id: pn.id,
      position: { x: pn.x, y: 120 },
      data: { label: pn.label },
      style: {
        border: SEVERITY_BORDER[pn.status],
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '13px',
        fontWeight: 600,
        background: 'var(--card)',
        color: 'var(--foreground)',
        width: 140,
        textAlign: 'center' as const,
      },
    });
  }

  // Pipeline edges
  edges.push(
    { id: 'e-spec-plan', source: 'spec', target: 'plan', animated: ps.plan === 'warning' || ps.plan === 'critical' },
    { id: 'e-plan-tasks', source: 'plan', target: 'tasks', animated: ps.tasks === 'warning' || ps.tasks === 'critical' },
    { id: 'e-tasks-analysis', source: 'tasks', target: 'analysis', animated: ps.analysis === 'warning' },
  );

  // Feature node (top center)
  nodes.push({
    id: 'feature',
    position: { x: 280, y: 0 },
    data: { label: feature.name },
    style: {
      border: '2px solid var(--foreground)',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 700,
      background: 'var(--card)',
      color: 'var(--foreground)',
      width: 200,
      textAlign: 'center' as const,
    },
  });

  edges.push(
    { id: 'e-feature-spec', source: 'feature', target: 'spec', style: { strokeDasharray: '5 5' } },
  );

  // Constitution node (if exists)
  if (impact.items.some(i => i.source === 'constitution')) {
    const constItem = impact.items.find(i => i.source === 'constitution');
    const severity = constItem?.severity || 'info';

    nodes.push({
      id: 'constitution',
      position: { x: 280, y: 260 },
      data: { label: 'Constitution' },
      style: {
        border: SEVERITY_BORDER[severity],
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '13px',
        fontWeight: 600,
        background: 'var(--card)',
        color: 'var(--foreground)',
        width: 160,
        textAlign: 'center' as const,
      },
    });

    edges.push({
      id: 'e-const-feature',
      source: 'constitution',
      target: 'feature',
      animated: severity === 'warning',
      style: { stroke: SEVERITY_COLORS[severity] },
    });
  }

  // User stories node (if relevant)
  if (impact.items.some(i => i.id === 'uncovered-stories')) {
    nodes.push({
      id: 'stories',
      position: { x: 500, y: 260 },
      data: { label: `User Stories (${feature.userStories.length})` },
      style: {
        border: SEVERITY_BORDER.warning,
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '13px',
        fontWeight: 600,
        background: 'var(--card)',
        color: 'var(--foreground)',
        width: 180,
        textAlign: 'center' as const,
      },
    });

    edges.push({
      id: 'e-stories-tasks',
      source: 'stories',
      target: 'tasks',
      animated: true,
      style: { stroke: SEVERITY_COLORS.warning },
    });
  }

  return { nodes, edges };
}

const SeverityIcon = ({ severity }: { severity: ImpactSeverity }) => {
  switch (severity) {
    case 'ok': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'info': return <Info className="w-4 h-4 text-blue-500" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

interface ImpactGraphProps {
  feature: Feature;
  constitution: Constitution | null;
}

function ImpactGraphInner({ feature, constitution }: ImpactGraphProps) {
  const impact = useMemo(() => calculateImpact(feature, constitution), [feature, constitution]);
  const { nodes, edges } = useMemo(() => buildGraph(feature, impact), [feature, impact]);

  const issues = impact.items.filter(i => i.severity !== 'ok');
  const allGood = issues.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Graph */}
      <div className="flex-1 min-h-[300px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          className="bg-[var(--background)]"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Impact items list */}
      <div className="border-t border-[var(--border)] p-4 max-h-[200px] overflow-y-auto">
        {allGood ? (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle2 className="w-4 h-4" />
            Pipeline complete — all documents aligned
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
              {issues.length} issue{issues.length !== 1 ? 's' : ''} found
            </p>
            {issues.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-sm">
                <SeverityIcon severity={item.severity} />
                <span className="text-[var(--foreground)]">{item.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ImpactGraph(props: ImpactGraphProps) {
  return (
    <ReactFlowProvider>
      <ImpactGraphInner {...props} />
    </ReactFlowProvider>
  );
}
