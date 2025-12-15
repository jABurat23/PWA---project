// client/src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { syncManager } from '../utils/sync';
import { initDB } from '../utils/idb';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { theme, changeTheme, themes, currentTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    initDB();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncAll = async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    try {
      const result = await syncManager.syncAll();
      if (result.success) {
        setLastSync(new Date());
      }
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const value = {
    theme,
    changeTheme,
    themes,
    currentTheme,
    isOnline,
    lastSync,
    syncing,
    syncAll
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};