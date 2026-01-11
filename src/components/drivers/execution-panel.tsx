'use client';

import { useState, useEffect } from 'react';
import type { ExecutionResult, SessionStatus } from '@/types/drivers';

interface ExecutionPanelProps {
  sessionId: string | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

/**
 * Execution Panel Component
 * Provides UI for executing commands in remote sandboxes
 */
export function ExecutionPanel({ sessionId, onConnect, onDisconnect }: ExecutionPanelProps) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!sessionId || !command.trim()) return;

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/drivers/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, command }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to execute command');
      }

      const result: ExecutionResult = data.result;

      // Display output
      let outputText = '';
      if (result.stdout) {
        outputText += `STDOUT:\n${result.stdout}\n\n`;
      }
      if (result.stderr) {
        outputText += `STDERR:\n${result.stderr}\n\n`;
      }
      outputText += `Exit Code: ${result.exitCode}\n`;
      outputText += `Duration: ${result.duration}ms\n`;

      setOutput(prev => prev + '\n' + outputText);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClear = () => {
    setOutput('');
    setError(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Remote Execution</h2>
        <div className="flex gap-2">
          {!sessionId ? (
            <button
              onClick={onConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {sessionId && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecute();
                }
              }}
              placeholder="Enter command to execute..."
              className="flex-1 px-3 py-2 border rounded"
              disabled={isExecuting}
            />
            <button
              onClick={handleExecute}
              disabled={isExecuting || !command.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? 'Executing...' : 'Execute'}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex-1 min-h-[300px] p-3 bg-gray-900 text-green-400 font-mono text-sm rounded overflow-auto">
            <pre className="whitespace-pre-wrap">{output || 'No output yet...'}</pre>
          </div>
        </>
      )}

      {!sessionId && (
        <div className="p-4 text-center text-gray-500">
          Connect to a remote driver to start executing commands
        </div>
      )}
    </div>
  );
}
