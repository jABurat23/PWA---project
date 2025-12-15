// client/src/components/pomodoro/Timer.jsx
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';

const Timer = ({ duration, onComplete }) => {
  const {
    minutes,
    seconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    getProgress
  } = useTimer(duration, onComplete);

  const formatTime = (m, s) => {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progress = getProgress();

  return (
    <div className="flex flex-col items-center">
      {/* Timer Display */}
      <div className="relative w-64 h-64 mb-8">
        {/* Progress Ring */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress Circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className="text-primary-500 transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>

        {/* Time Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">
              {formatTime(minutes, seconds)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isRunning 
                ? (isPaused ? 'Paused' : 'Focus Time') 
                : 'Ready to start'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {!isRunning ? (
          <button
            onClick={start}
            className="btn btn-primary px-8 py-4 text-lg flex items-center gap-2"
          >
            <Play size={24} />
            Start
          </button>
        ) : isPaused ? (
          <button
            onClick={resume}
            className="btn btn-primary px-8 py-4 text-lg flex items-center gap-2"
          >
            <Play size={24} />
            Resume
          </button>
        ) : (
          <button
            onClick={pause}
            className="btn btn-secondary px-8 py-4 text-lg flex items-center gap-2"
          >
            <Pause size={24} />
            Pause
          </button>
        )}

        <button
          onClick={() => reset()}
          className="btn btn-secondary px-8 py-4 text-lg flex items-center gap-2"
        >
          <RotateCcw size={24} />
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;