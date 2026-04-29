'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

const MindMapView = dynamic(
  () => import('@/components/mind-map').then(mod => mod.MindMapView),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">Loading mind map...</div> }
);

export default function MindMapPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjectId() {
      try {
        const res = await fetch(`/api/project/${projectSlug}/data?view=kanban`);
        if (res.ok) {
          const data = await res.json();
          setProjectId(data.projectId || null);
        }
      } catch {
        // projectId will remain null — convert feature won't work but canvas still loads
      }
    }
    fetchProjectId();
  }, [projectSlug]);

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
          Double-click to add nodes. Drag from handles to connect. Right-click for options.
        </span>
      </div>
      <div className="flex-1">
        <MindMapView projectSlug={projectSlug} projectId={projectId} />
      </div>
    </div>
  );
}
