// client/src/components/common/ConnectionBanner.jsx
import { useState, useEffect } from 'react';
import { WifiOff, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ConnectionBanner = () => {
  const { isOnline } = useApp();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [dismissed, setDismissed] = useState(false);
  const [lastCheck, setLastCheck] = useState(Date.now());

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isOnline]);

  const checkBackend = async () => {
    if (!isOnline) {
      setBackendStatus('offline');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      console.error('Backend check failed:', error);
      setBackendStatus('error');
    } finally {
      setLastCheck(Date.now());
    }
  };

  if (dismissed) return null;
  if (backendStatus === 'connected') return null;

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up
      ${backendStatus === 'offline' 
        ? 'bg-orange-500' 
        : 'bg-red-500'
      }
    `}>
      <div className="max-w-7xl mx-auto flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          {backendStatus === 'offline' ? (
            <WifiOff size={24} />
          ) : (
            <AlertCircle size={24} />
          )}
          
          <div>
            <p className="font-semibold">
              {backendStatus === 'offline' 
                ? '📡 You\'re Offline' 
                : '⚠️ Backend Server Unavailable'
              }
            </p>
            <p className="text-sm opacity-90">
              {backendStatus === 'offline'
                ? 'Working in offline mode. Data will sync when you\'re back online.'
                : 'Can\'t connect to the backend server. Check if the server is running. Your data is saved locally.'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              checkBackend();
              setDismissed(false);
            }}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionBanner;