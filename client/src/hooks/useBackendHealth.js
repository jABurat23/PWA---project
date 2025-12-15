// client/src/hooks/useBackendHealth.js
import { useState, useEffect } from 'react';

export const useBackendHealth = () => {
  const [status, setStatus] = useState({
    isHealthy: false,
    checking: true,
    lastCheck: null,
    error: null
  });

  const checkHealth = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://pwa-project-cl0c.onrender.com/health', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setStatus({
          isHealthy: true,
          checking: false,
          lastCheck: new Date(),
          error: null,
          serverInfo: data
        });
        return true;
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus({
        isHealthy: false,
        checking: false,
        lastCheck: new Date(),
        error: error.message
      });
      return false;
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...status,
    recheckHealth: checkHealth
  };
};