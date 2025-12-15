import { Wifi, WifiOff } from 'lucide-react';
import { useOnline } from '../../hooks/useOnline';

const OnlineStatus = () => {
  const isOnline = useOnline();

  return (
    <div className={`
      fixed top-4 right-4 px-3 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm
      transition-all duration-300 z-50
      ${isOnline 
        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      }
    `}>
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};

export default OnlineStatus;