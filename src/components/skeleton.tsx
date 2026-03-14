import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--muted)]',
        className
      )}
    />
  );
}

/** Full-width header skeleton matching the app header */
export function HeaderSkeleton() {
  return (
    <header className="border-b border-[var(--border)] h-14 bg-[var(--background)]">
      <div className="max-w-5xl mx-auto h-full flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="w-[22px] h-[22px] rounded" />
            <Skeleton className="w-24 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-16 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
}

/** Project list skeleton with rows */
export function ProjectListSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-4">
      {/* Heading */}
      <div className="flex items-baseline justify-between">
        <Skeleton className="w-24 h-4" />
      </div>
      {/* Search bar */}
      <Skeleton className="w-full h-10 rounded-md" />
      {/* Table header */}
      <div className="grid gap-4 px-3 py-2" style={{ gridTemplateColumns: '1fr 80px 120px' }}>
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-16 h-3" />
      </div>
      {/* Rows */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4 px-3 py-3.5 items-center"
            style={{ gridTemplateColumns: '1fr 80px 120px' }}
          >
            <div className="space-y-1.5">
              <Skeleton className="w-36 h-4" />
              <Skeleton className="w-48 h-3" />
            </div>
            <Skeleton className="w-6 h-4" />
            <Skeleton className="w-14 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kanban board skeleton */
export function KanbanSkeleton() {
  const columns = [
    { name: 'Backlog', cards: 3 },
    { name: 'In Progress', cards: 2 },
    { name: 'Review', cards: 1 },
    { name: 'Done', cards: 2 },
  ];
  return (
    <div className="space-y-6">
      {/* Project info bubble skeleton */}
      <div className="flex justify-start">
        <Skeleton className="w-full max-w-md h-24 rounded-lg" />
      </div>
      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.name} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-5 h-3" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: col.cards }).map((_, j) => (
                <Skeleton key={j} className="w-full h-20 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Feature detail skeleton */
export function FeatureDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSkeleton />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Feature title */}
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-72 h-4" />
          </div>
          {/* Stage badges */}
          <div className="flex gap-2">
            <Skeleton className="w-20 h-7 rounded-full" />
            <Skeleton className="w-24 h-7 rounded-full" />
          </div>
          {/* Content sections */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-[var(--border)] rounded-lg p-4 space-y-3">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-4/5 h-3" />
                <Skeleton className="w-3/5 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
