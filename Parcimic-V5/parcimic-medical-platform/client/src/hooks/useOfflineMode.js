// useOfflineMode.js
// Hook to detect and handle offline mode

import { useEffect, useState } from 'react';
import * as offlineService from '../utils/offlineService';

/**
 * Hook to monitor online/offline status
 * @returns {Object} { isOnline, hasData, offlineData, lastSync }
 */
export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data on mount
    const cached = {
      healthCheck: offlineService.getCachedHealthCheck(),
      symptoms: offlineService.getCachedSymptoms(),
      medications: offlineService.getCachedMedications(),
    };
    setOfflineData(cached);

    // Load last sync time
    const syncTime = localStorage.getItem('parcimic_last_sync');
    if (syncTime) setLastSync(new Date(syncTime));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const hasData = offlineData && (
    offlineData.healthCheck || 
    offlineData.symptoms || 
    offlineData.medications
  );

  return {
    isOnline,
    hasData,
    offlineData,
    lastSync,
  };
}

/**
 * Hook to sync data when connection is restored
 * @param {Function} onSync - Callback when sync completes
 * @returns {Object} { syncing, syncError, manualSync }
 */
export function useSyncOnOnline(onSync) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncError(null);

      // Small delay to ensure connection is stable
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSyncing(true);
      try {
        if (onSync) {
          await onSync();
        }
        localStorage.setItem('parcimic_last_sync', new Date().toISOString());
      } catch (err) {
        console.error('[useSyncOnOnline] sync failed:', err);
        setSyncError(err.message || 'Sync failed');
      } finally {
        setSyncing(false);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSync]);

  const manualSync = async () => {
    if (!isOnline) {
      setSyncError('No internet connection');
      return;
    }

    setSyncing(true);
    try {
      if (onSync) {
        await onSync();
      }
      localStorage.setItem('parcimic_last_sync', new Date().toISOString());
      setSyncError(null);
    } catch (err) {
      console.error('[useSyncOnOnline] manual sync failed:', err);
      setSyncError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return { syncing, syncError, manualSync, isOnline };
}
