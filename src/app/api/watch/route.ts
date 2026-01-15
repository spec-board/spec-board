import { NextRequest, NextResponse } from 'next/server';
import { watch } from 'chokidar';
import { parseProject } from '@/lib/parser';
import { isPathSafe } from '@/lib/path-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectPath = searchParams.get('path');

  if (!projectPath) {
    return NextResponse.json(
      { error: 'Project path is required' },
      { status: 400 }
    );
  }

  // Validate path is safe to watch (prevent path traversal attacks)
  const { safe, resolvedPath } = isPathSafe(projectPath);
  if (!safe) {
    return NextResponse.json(
      { error: 'Access denied: Path is outside allowed directories' },
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Circuit breaker state to prevent cascade of parse operations
      let isParsingInProgress = false;
      let pendingChange = false;

      // Send initial data
      const project = await parseProject(resolvedPath);
      if (project) {
        const data = `data: ${JSON.stringify({ type: 'update', data: project })}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Watch for file changes using native OS events (FSEvents on macOS, inotify on Linux)
      // This is much more efficient than polling - only triggers on actual file changes
      const watcher = watch(resolvedPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 3,
        usePolling: false,       // Use native OS file watching (low CPU)
        awaitWriteFinish: {      // Wait for writes to complete before triggering
          stabilityThreshold: 300,
          pollInterval: 100,
        },
      });

      const handleChange = async () => {
        // Circuit breaker: skip if already parsing
        if (isParsingInProgress) {
          pendingChange = true;
          return;
        }

        isParsingInProgress = true;
        try {
          const updatedProject = await parseProject(resolvedPath);
          if (updatedProject) {
            const data = `data: ${JSON.stringify({ type: 'update', data: updatedProject })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error('Error parsing project on change:', error);
        } finally {
          isParsingInProgress = false;

          // If changes occurred during parsing, schedule one more parse
          if (pendingChange) {
            pendingChange = false;
            // Use setTimeout to avoid stack overflow from recursive calls
            setTimeout(handleChange, 100);
          }
        }
      };

      // Debounce changes
      let timeout: NodeJS.Timeout | null = null;
      const debouncedChange = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(handleChange, 300);
      };

      watcher.on('change', debouncedChange);
      watcher.on('add', debouncedChange);
      watcher.on('unlink', debouncedChange);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        watcher.close();
        if (timeout) clearTimeout(timeout);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
