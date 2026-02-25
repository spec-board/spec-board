'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contract {
  name: string;
  description?: string;
  endpoint: string;
  method: string;
  request?: {
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
  };
  response?: {
    status?: number;
    body?: any;
  };
  errors?: Array<{
    status: number;
    description: string;
  }>;
}

interface JsonContractsViewerProps {
  content: string; // JSON string
  className?: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function ContractCard({ contract }: { contract: Contract }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const method = contract.method?.toUpperCase() || 'GET';
  const methodClass = methodColors[method] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <FileCode className="w-4 h-4 flex-shrink-0 text-blue-400" />
        <span className="font-medium flex-1">{contract.name}</span>
        <span className={cn('px-2 py-0.5 text-xs font-medium rounded border', methodClass)}>
          {method}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-[var(--border)] space-y-4">
          {/* Description */}
          {contract.description && (
            <p className="text-sm text-[var(--muted-foreground)]">{contract.description}</p>
          )}

          {/* Endpoint */}
          <div>
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Endpoint</span>
            <div className="mt-1 font-mono text-sm bg-[var(--muted)] p-2 rounded">
              {contract.endpoint}
            </div>
          </div>

          {/* Request */}
          {contract.request && (
            <div>
              <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Request</span>
              <div className="mt-2 space-y-3">
                {contract.request.headers && (
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)]">Headers</span>
                    <div className="mt-1 font-mono text-xs bg-[var(--muted)] p-2 rounded overflow-x-auto">
                      {Object.entries(contract.request.headers).map(([k, v]) => (
                        <div key={k}><span className="text-blue-400">{k}</span>: {String(v)}</div>
                      ))}
                    </div>
                  </div>
                )}
                {contract.request.queryParams && (
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)]">Query Parameters</span>
                    <div className="mt-1 font-mono text-xs bg-[var(--muted)] p-2 rounded overflow-x-auto">
                      {Object.entries(contract.request.queryParams).map(([k, v]) => (
                        <div key={k}><span className="text-green-400">{k}</span>: {String(v)}</div>
                      ))}
                    </div>
                  </div>
                )}
                {contract.request.body && (
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)]">Body</span>
                    <pre className="mt-1 text-xs bg-[var(--muted)] p-2 rounded overflow-x-auto">
                      {JSON.stringify(contract.request.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Response */}
          {contract.response && (
            <div>
              <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Response</span>
              <div className="mt-2 space-y-2">
                {contract.response.status && (
                  <div className="font-mono text-sm">
                    Status: <span className="text-green-400">{contract.response.status}</span>
                  </div>
                )}
                {contract.response.body && (
                  <pre className="text-xs bg-[var(--muted)] p-2 rounded overflow-x-auto">
                    {JSON.stringify(contract.response.body, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {contract.errors && contract.errors.length > 0 && (
            <div>
              <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Errors</span>
              <div className="mt-2 space-y-1">
                {contract.errors.map((error, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-red-400 font-mono">{error.status}</span>
                    <span className="text-[var(--muted-foreground)]">{error.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function JsonContractsViewer({ content, className }: JsonContractsViewerProps) {
  const contracts = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed.contracts && Array.isArray(parsed.contracts)) {
        return parsed.contracts;
      }
      return [];
    } catch {
      return [];
    }
  }, [content]);

  if (contracts.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]', className)}>
        <FileCode className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No contracts defined</p>
        <p className="text-sm mt-2">This feature has no API contracts</p>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        {contracts.length} contract{contracts.length !== 1 ? 's' : ''} defined
      </p>
      {contracts.map((contract: Contract, index: number) => (
        <ContractCard key={index} contract={contract} />
      ))}
    </div>
  );
}
