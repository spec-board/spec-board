'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MindMapView } from '@/components/mind-map';

export default function MindMapPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      <div className="border-b border-[var(--border)] h-12 flex items-center px-4 gap-3">
        <button
          onClick={() => router.push(`/projects/${projectSlug}`)}
          className="btn-icon"
          title="Back to board"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-[var(--foreground)]">
          Mind Map
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          Double-click to add nodes. Drag from handles to connect.
        </span>
      </div>
      <div className="flex-1">
        <MindMapView projectSlug={projectSlug} />
      </div>
    </div>
  );
}
