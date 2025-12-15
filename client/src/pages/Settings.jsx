// client/src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { 
  Sun, Moon, Palette, Wifi, WifiOff, RefreshCw, Database, 
  Trash2, Download, Check, Info, Bell, Shield
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { taskDB, noteDB, habitDB, pomodorooDB } from '../utils/idb';

const Settings = () => {
  const { theme, changeTheme, themes, isOnline, lastSync, syncing, syncAll } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('appearance');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const tasks = await taskDB.getAll();
      const notes = await noteDB.getAll();
      const habits = await habitDB.getAll();
      const pomodoro = await pomodorooDB.getAll();

      setStats({
        tasks: tasks.filter(t => !t.deleted).length,
        notes: notes.filter(n => !n.deleted).length,
        habits: habits.filter(h => !h.deleted).length,
        pomodoro: pomodoro.length,
        totalSize: new Blob([JSON.stringify({ tasks, notes, habits, pomodoro })]).size
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      const result = await syncAll();
      if (result.success) {
        alert('✅ Sync completed successfully!');
      } else {
        alert('⚠️ Sync failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Sync error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('⚠️ This will delete ALL local data. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;

    try {
      const allTasks = await taskDB.getAll();
      const allNotes = await noteDB.getAll();
      const allHabits = await habitDB.getAll();
      const allSessions = await pomodorooDB.getAll();
      
      await Promise.all([
        ...allTasks.map(t => taskDB.delete(t.id)),
        ...allNotes.map(n => noteDB.delete(n.id)),
        ...allHabits.map(h => habitDB.delete(h.id)),
        ...allSessions.map(s => pomodorooDB.delete(s.id))
      ]);
      
      alert('✅ All local data cleared!');
      await loadStats();
    } catch (error) {
      alert('❌ Error clearing data: ' + error.message);
    }
  };

  const handleExportData = async () => {
    try {
      const tasks = await taskDB.getAll();
      const notes = await noteDB.getAll();
      const habits = await habitDB.getAll();
      const pomodoro = await pomodorooDB.getAll();

      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        tasks: tasks.filter(t => !t.deleted),
        notes: notes.filter(n => !n.deleted),
        habits: habits.filter(h => !h.deleted),
        pomodoro_sessions: pomodoro
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productivity-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert('✅ Data exported successfully!');
    } catch (error) {
      alert('❌ Error exporting data: ' + error.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'sync', label: 'Sync & Data', icon: RefreshCw },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'about', label: 'About', icon: Info }
  ];
  const [diagnostics, setDiagnostics] = useState(null);

const runDiagnostics = async () => {
  setLoading(true);
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Internet Connection
  results.tests.push({
    name: 'Internet Connection',
    status: navigator.onLine ? 'pass' : 'fail',
    message: navigator.onLine ? 'Connected to internet' : 'No internet connection'
  });

  // Test 2: IndexedDB
  try {
    await initDB();
    const testData = await taskDB.getAll();
    results.tests.push({
      name: 'IndexedDB',
      status: 'pass',
      message: `Working (${testData.length} tasks stored)`
    });
  } catch (error) {
    results.tests.push({
      name: 'IndexedDB',
      status: 'fail',
      message: error.message
    });
  }

  // Test 3: Backend Connection
  try {
    const response = await fetch('http://localhost:5000/health', {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      results.tests.push({
        name: 'Backend Server',
        status: 'pass',
        message: `Connected (${data.environment || 'unknown'} mode)`
      });
    } else {
      results.tests.push({
        name: 'Backend Server',
        status: 'fail',
        message: `Server returned ${response.status}`
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Backend Server',
      status: 'fail',
      message: 'Cannot connect to backend. Is the server running?'
    });
  }

  // Test 4: Database Connection (via backend)
  try {
    const response = await fetch('http://localhost:5000/api/tasks?limit=1', {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      results.tests.push({
        name: 'MySQL Database',
        status: 'pass',
        message: 'Database connection successful'
      });
    } else {
      results.tests.push({
        name: 'MySQL Database',
        status: 'fail',
        message: 'Database query failed'
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'MySQL Database',
      status: 'fail',
      message: 'Cannot query database'
    });
  }

  // Test 5: Service Worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    results.tests.push({
      name: 'Service Worker',
      status: registration ? 'pass' : 'warning',
      message: registration ? 'Active and caching' : 'Not registered'
    });
  } else {
    results.tests.push({
      name: 'Service Worker',
      status: 'fail',
      message: 'Not supported in this browser'
    });
  }

  setDiagnostics(results);
  setLoading(false);
};

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your productivity dashboard
        </p>
      </div>

      <div className="grid lg:grid-cols-[250px,1fr] gap-6">
        {/* Sidebar Navigation */}
        <div className="card p-2 h-fit">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                  ${activeSection === section.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <section.icon size={20} />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Palette size={24} />
                  Theme Selection
                </h2>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose a theme that suits your style
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(themes).map(([key, themeData]) => (
                    <button
                      key={key}
                      onClick={() => changeTheme(key)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${theme === key
                          ? 'border-primary-500 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      {/* Theme Preview */}
                      <div 
                        className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${themeData.colors.background} 0%, ${themeData.colors.surface} 100%)`
                        }}
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: themeData.colors.primary }}
                        >
                          {key === 'light' && <Sun size={24} color={themeData.colors.text} />}
                          {key === 'dark' && <Moon size={24} color={themeData.colors.text} />}
                          {!['light', 'dark'].includes(key) && <Palette size={24} color={themeData.colors.text} />}
                        </div>
                      </div>

                      {/* Theme Name */}
                      <p className="font-medium text-center">{themeData.name}</p>

                      {/* Selected Indicator */}
                      {theme === key && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Customization Info */}
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Info size={20} />
                  Theme Tips
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Themes apply across all pages instantly</li>
                  <li>• Your choice is saved and persists between sessions</li>
                  <li>• Dark themes reduce eye strain in low light</li>
                  <li>• Try different themes to find your perfect match!</li>
                </ul>
              </div>
            </div>
          )}

          {/* Sync & Data Section */}
          {activeSection === 'sync' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    {isOnline ? (
                      <Wifi className="text-green-500" size={32} />
                    ) : (
                      <WifiOff className="text-red-500" size={32} />
                    )}
                    <div>
                      <p className="font-medium text-lg">
                        {isOnline ? 'Connected' : 'Offline Mode'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isOnline ? 'Syncing with server' : 'Data saved locally only'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {lastSync && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Last synced: {lastSync.toLocaleString()}
                  </p>
                )}

                <button
                  onClick={handleSync}
                  disabled={!isOnline || syncing || loading}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Data Storage */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Local Storage</h2>
                
                {stats && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasks</p>
                        <p className="text-2xl font-bold">📝 {stats.tasks}</p>
                      </div>
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                        <p className="text-2xl font-bold">📓 {stats.notes}</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Habits</p>
                        <p className="text-2xl font-bold">🎯 {stats.habits}</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sessions</p>
                        <p className="text-2xl font-bold">🍅 {stats.pomodoro}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
                        <span className="font-medium">{formatBytes(stats.totalSize)}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportData}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export Backup
                  </button>
                  <button
                    onClick={handleClearData}
                    className="btn btn-secondary flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={18} />
                    Clear All Data
                  </button>
                </div>
              </div>
              {/* System Diagnostics */}
<div className="card">
  <h2 className="text-xl font-semibold mb-4">System Diagnostics</h2>
  
  <button
    onClick={runDiagnostics}
    disabled={loading}
    className="btn btn-secondary w-full mb-4"
  >
    {loading ? 'Running Tests...' : 'Run Diagnostics'}
  </button>

  {diagnostics && (
    <div className="space-y-2">
      {diagnostics.tests.map((test, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border ${
            test.status === 'pass'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : test.status === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{test.name}</span>
            <span className={`text-sm font-semibold ${
              test.status === 'pass' ? 'text-green-600' : 
              test.status === 'warning' ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {test.status === 'pass' ? '✓ PASS' : 
               test.status === 'warning' ? '⚠ WARNING' : 
               '✗ FAIL'}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {test.message}
          </p>
        </div>
      ))}
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Last checked: {new Date(diagnostics.timestamp).toLocaleString()}
      </p>
    </div>
  )}
</div>

            </div>
            
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Bell size={24} />
                Notifications
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Notification settings coming soon...
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50">
                  <p className="font-medium">Task Reminders</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about upcoming deadlines</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50">
                  <p className="font-medium">Habit Reminders</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily reminders for your habits</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50">
                  <p className="font-medium">Pomodoro Alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sound and notifications for timer</p>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield size={24} />
                Privacy & Security
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold mb-2 text-green-900 dark:text-green-200">
                    🔒 Your Data is Private
                  </h3>
                  <ul className="text-sm text-green-800 dark:text-green-300 space-y-2">
                    <li>✓ All data stored locally on your device</li>
                    <li>✓ No tracking or analytics</li>
                    <li>✓ Optional cloud sync with your own backend</li>
                    <li>✓ You control your data completely</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">About This App</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">App Name</span>
                    <span className="font-medium">Productivity Dashboard</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Version</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Type</span>
                    <span className="font-medium">Progressive Web App</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">Built with</span>
                    <span className="font-medium">React + Node.js</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-3">✨ Features</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    'Task Management',
                    'Markdown Notes',
                    'Habit Tracking',
                    'Pomodoro Timer',
                    'Offline Support',
                    'Auto-sync',
                    'PWA Installable',
                    'Dark Mode',
                    'Responsive Design',
                    'Data Export'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="text-green-500" size={16} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Troubleshooting Guide */}
<div className="card">
  <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">
    🔧 Troubleshooting
  </h3>
  
  <div className="space-y-3 text-sm">
    <details className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <summary className="font-medium cursor-pointer">
        Backend server not connecting
      </summary>
      <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
        <p><strong>Check if server is running:</strong></p>
        <code className="block p-2 bg-gray-800 text-green-400 rounded text-xs">
          cd server && npm run dev
        </code>
        <p><strong>Default URL:</strong> http://localhost:5000</p>
        <p><strong>Check .env file:</strong> PORT=5000</p>
      </div>
    </details>

    <details className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <summary className="font-medium cursor-pointer">
        Database connection failed
      </summary>
      <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
        <p><strong>Start MySQL:</strong></p>
        <code className="block p-2 bg-gray-800 text-green-400 rounded text-xs">
          # Windows: Open MySQL Workbench or Services<br/>
          # Mac: brew services start mysql<br/>
          # Linux: sudo systemctl start mysql
        </code>
        <p><strong>Check credentials in server/.env:</strong></p>
        <code className="block p-2 bg-gray-800 text-green-400 rounded text-xs">
          DB_HOST=localhost<br/>
          DB_USER=root<br/>
          DB_PASSWORD=your_password<br/>
          DB_NAME=productivity_dashboard
        </code>
      </div>
    </details>

    <details className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <summary className="font-medium cursor-pointer">
        App not working offline
      </summary>
      <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
        <p>1. Check Service Worker is registered (F12 → Application → Service Workers)</p>
        <p>2. Clear browser cache and reload</p>
        <p>3. Make sure you visited the app online at least once</p>
        <p>4. IndexedDB should have data stored locally</p>
      </div>
    </details>

    <details className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <summary className="font-medium cursor-pointer">
        Data not syncing
      </summary>
      <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
        <p>1. Check you're online (top-right indicator)</p>
        <p>2. Backend server must be running</p>
        <p>3. Click "Sync Now" button manually</p>
        <p>4. Check browser console for sync errors (F12)</p>
      </div>
    </details>
  </div>
</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;