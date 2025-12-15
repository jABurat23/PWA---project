// client/src/pages/Pomodoro.jsx
import { useState } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';
import Timer from '../components/pomodoro/Timer';
import SessionHistory from '../components/pomodoro/SessionHistory';
import PomodoroStats from '../components/pomodoro/PomodoroStats';

const Pomodoro = () => {
  const {
    sessions,
    todaySessions,
    stats,
    loading,
    logSession,
    deleteSession,
    getTodayStats
  } = usePomodoro();

  const [duration, setDuration] = useState(25);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleComplete = async () => {
    try {
      await logSession(duration);
      setShowCelebration(true);
      
      // Play completion sound (optional)
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8NVqzn77BdGAg+ltryxnMpBSuBzvLZiTYIG2m98N+dUAwPUKXh8bllHAU7k9n0y38tBSh+zPLaizsIGGe57OihUxELTKXf8rJnHgU2jdT0z4IwBSF1xe3gnFAPDlSq5O+sWBkHPJPY88p6LgUme8rx3Ys8CRZlue3ool4WCkmh4PGvZh0GNo/U8s+CMQY=');
      audio.play().catch(() => {});

      setTimeout(() => setShowCelebration(false), 3000);
    } catch (error) {
      alert('Error logging session: ' + error.message);
    }
  };

  const handleDeleteSession = async (id) => {
    if (confirm('Delete this session?')) {
      try {
        await deleteSession(id);
      } catch (error) {
        alert('Error deleting session: ' + error.message);
      }
    }
  };

  const todayStats = getTodayStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-1">🍅 Pomodoro Timer</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Focus on your tasks with the Pomodoro Technique
        </p>
      </div>

      {/* Celebration Message */}
      {showCelebration && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-6 text-center animate-slide-down">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold text-green-900 dark:text-green-200 mb-1">
            Session Complete!
          </h3>
          <p className="text-green-800 dark:text-green-300">
            Great work! Take a short break.
          </p>
        </div>
      )}

      {/* Timer Duration Selector */}
      <div className="card p-6">
        <div className="text-center mb-6">
          <h3 className="font-semibold mb-4">Select Duration</h3>
          <div className="flex gap-2 justify-center flex-wrap">
            {[15, 25, 45, 50].map((min) => (
              <button
                key={min}
                onClick={() => setDuration(min)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors
                  ${duration === min
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>

        {/* Timer Component */}
        <Timer duration={duration} onComplete={handleComplete} />
      </div>

      {/* Today's Summary */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-200">
          📊 Today's Progress
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
              {todayStats.sessions}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">Sessions</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
              {todayStats.minutes}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">Minutes</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
              {todayStats.hours}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">Hours</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Weekly Statistics</h2>
          <PomodoroStats stats={stats} />
        </div>
      )}

      {/* Session History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        <SessionHistory
          sessions={sessions.slice(0, 10)}
          onDelete={handleDeleteSession}
        />
      </div>

      {/* Info */}
      <div className="card bg-gray-50 dark:bg-gray-800 p-4">
        <h3 className="font-semibold mb-2">💡 About Pomodoro Technique</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Work in focused intervals (typically 25 minutes)</li>
          <li>• Take a 5-minute break after each session</li>
          <li>• After 4 sessions, take a longer 15-30 minute break</li>
          <li>• Eliminate distractions during work sessions</li>
        </ul>
      </div>
    </div>
  );
};

export default Pomodoro;