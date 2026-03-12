import { HeaderSkeleton, KanbanSkeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSkeleton />
      <main className="flex-1 container mx-auto px-4 py-6">
        <KanbanSkeleton />
      </main>
    </div>
  );
}
