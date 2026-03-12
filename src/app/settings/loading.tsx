import { HeaderSkeleton, Skeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="w-24 h-6" />
          </div>
        </div>
      </header>
      <div className="flex-1 flex">
        <aside className="w-1/4 min-w-[200px] max-w-[280px] border-r border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-9 rounded-lg" />
          ))}
        </aside>
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-72 h-4" />
          </div>
          <Skeleton className="w-full h-32 rounded-lg" />
          <Skeleton className="w-full h-48 rounded-lg" />
        </main>
      </div>
    </div>
  );
}
