// client/src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import InstallPrompt from '../common/InstallPrompt';
import ConnectionBanner from '../common/ConnectionBanner';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
   useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <main className="flex-1 p-4 lg:p-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <InstallPrompt />
      <ConnectionBanner />
    </div>
  );
};

export default Layout;