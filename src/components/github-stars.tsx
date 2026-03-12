'use client';

import { useEffect, useState } from 'react';
import { Github, Star } from 'lucide-react';

const REPO = 'paulpham157/spec-board';
const CACHE_KEY = 'gh-stars';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { count, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setStars(count);
          return;
        }
      } catch { /* ignore */ }
    }

    fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count);
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ count: data.stargazers_count, ts: Date.now() })
          );
        }
      })
      .catch(() => { /* silently fail */ });
  }, []);

  const formatted = stars !== null
    ? stars >= 1000
      ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k`
      : String(stars)
    : null;

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      aria-label="GitHub Repository"
    >
      <Github className="w-3.5 h-3.5" />
      {formatted !== null && (
        <>
          <Star className="w-3 h-3 fill-current" />
          <span className="text-xs font-medium tabular-nums">{formatted}</span>
        </>
      )}
    </a>
  );
}
