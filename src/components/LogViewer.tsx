import React from 'react';
import { Terminal } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface LogViewerProps {
  logs: LogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <Terminal className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-200">Logs del Sistema</h3>
      </div>
      <div className="h-96 overflow-y-auto font-mono text-sm">
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div
              key={`log-${index}`}
              className={`p-2 rounded ${
                log.type === 'error'
                  ? 'text-red-400 bg-red-900/20'
                  : log.type === 'success'
                  ? 'text-green-400 bg-green-900/20'
                  : 'text-gray-300 bg-gray-800/40'
              }`}
            >
              <span className="text-gray-500">[{log.timestamp}]</span>{' '}
              {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}