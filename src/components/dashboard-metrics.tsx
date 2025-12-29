'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, CheckCircle2, Clock, Layers, BarChart3, AlertTriangle, XCircle } from 'lucide-react';
import type { DashboardMetrics } from '@/types';
import { cn, getStageLabel } from '@/lib/utils';

const STAGE_COLORS: Record<string, string> = {
  specify: '#a855f7',
  plan: '#3b82f6',
  tasks: '#eab308',
  implement: '#f97316',
  complete: '#22c55e',
};

interface StatBadgeProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

function StatBadge({ icon, value, label, color }: StatBadgeProps) {
  // Build accessible label
  const ariaLabel = `${label}: ${value}`;

  return (
    <article
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)] focus-ring"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <span className={cn('flex-shrink-0', color)} aria-hidden="true">{icon}</span>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight" aria-hidden="true">{value}</span>
        <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      </div>
      {/* Screen reader text */}
      <span className="sr-only">{ariaLabel}</span>
    </article>
  );
}

interface DashboardMetricsProps {
  metrics: DashboardMetrics;
}

export function DashboardMetricsPanel({ metrics }: DashboardMetricsProps) {
  // Transform data for ComposedChart - correlate phases with cumulative progress
  const correlatedData = useMemo(() => {
    const phases = Object.entries(metrics.tasksByPhase);
    let cumulative = 0;

    return phases.map(([phase, count]) => {
      cumulative += count;
      const progressPercent = metrics.totalTasks > 0
        ? Math.round((cumulative / metrics.totalTasks) * 100)
        : 0;

      return {
        name: phase.length > 12 ? phase.slice(0, 12) + '...' : phase,
        fullName: phase,
        tasks: count,
        cumulative,
        progress: progressPercent,
      };
    });
  }, [metrics.tasksByPhase, metrics.totalTasks]);

  // Stage distribution for legend
  const stageData = useMemo(() => {
    return Object.entries(metrics.featuresByStage)
      .filter(([_, count]) => count > 0)
      .map(([stage, count]) => ({
        stage,
        label: getStageLabel(stage),
        count,
        color: STAGE_COLORS[stage],
      }));
  }, [metrics.featuresByStage]);

  const hasData = correlatedData.length > 0;

  // Build chart description for screen readers
  const chartDescription = useMemo(() => {
    if (!hasData) return 'No data available';
    const phaseDescriptions = correlatedData.map(d => `${d.fullName}: ${d.tasks} tasks`).join(', ');
    return `Task distribution by phase. ${phaseDescriptions}. Overall completion: ${metrics.completionPercentage}%`;
  }, [correlatedData, hasData, metrics.completionPercentage]);

  return (
    <section
      className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4"
      aria-label="Project metrics overview"
    >
      {/* Header with title */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[var(--muted-foreground)]" aria-hidden="true" />
        <h3 className="text-sm font-medium" id="metrics-heading">Project Overview</h3>
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        Project has {metrics.totalFeatures} features, {metrics.completionPercentage}% complete.
        {metrics.completedTasks} tasks done, {metrics.pendingTasks} pending.
      </div>

      {/* Compact stat badges row */}
      <div className="flex flex-wrap gap-3 mb-4" role="group" aria-label="Key metrics">
        <StatBadge
          icon={<Layers className="w-4 h-4" />}
          value={metrics.totalFeatures}
          label="Features"
          color="text-blue-400"
        />
        <StatBadge
          icon={<TrendingUp className="w-4 h-4" />}
          value={`${metrics.completionPercentage}%`}
          label="Complete"
          color="text-green-400"
        />
        <StatBadge
          icon={<CheckCircle2 className="w-4 h-4" />}
          value={metrics.completedTasks}
          label="Done"
          color="text-green-400"
        />
        <StatBadge
          icon={<Clock className="w-4 h-4" />}
          value={metrics.pendingTasks}
          label="Pending"
          color="text-yellow-400"
        />
      </div>

      {/* Stage distribution pills */}
      {stageData.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {stageData.map(({ stage, label, count, color }) => (
            <div
              key={stage}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: `${color}20` }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span style={{ color }}>{label}</span>
              <span className="text-[var(--muted-foreground)]">({count})</span>
            </div>
          ))}
        </div>
      )}

      {/* ComposedChart - Tasks by Phase with Progress Line */}
      {hasData ? (
        <figure role="img" aria-label={chartDescription}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={correlatedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              aria-hidden="true"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  if (value === undefined) return ['-', name ?? ''];
                  if (name === 'progress') return [`${value}%`, 'Cumulative Progress'];
                  if (name === 'tasks') return [value, 'Tasks in Phase'];
                  return [value, name ?? ''];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.fullName || label;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => {
                  if (value === 'tasks') return 'Tasks per Phase';
                  if (value === 'progress') return 'Cumulative Progress';
                  return value;
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="tasks"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="progress"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          {/* Screen reader description */}
          <figcaption className="sr-only">
            {chartDescription}
          </figcaption>
        </figure>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-[var(--muted-foreground)]">
          No data yet - add features and tasks to see metrics
        </div>
      )}
    </section>
  );
}
