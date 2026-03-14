import { HeaderSkeleton, ProjectListSkeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSkeleton />
      <main className="flex-1">
        <ProjectListSkeleton />
      </main>
    </div>
  );
}
