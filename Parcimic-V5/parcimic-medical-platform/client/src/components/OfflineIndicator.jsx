import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOfflineMode } from '../hooks/useOfflineMode';

export default function OfflineIndicator() {
  const { isOnline, lastSync } = useOfflineMode();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-warning-50 border border-warning-100 rounded-lg">
      <WifiOff size={15} className="text-warning-600 shrink-0" strokeWidth={2} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-warning-800">You're offline</p>
        {lastSync && (
          <p className="text-xs text-warning-600">Last sync: {lastSync.toLocaleTimeString()}</p>
        )}
      </div>
      <div className="w-2 h-2 bg-warning-400 rounded-full animate-pulse shrink-0" />
    </div>
  );
}
