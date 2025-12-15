// client/src/hooks/useTimer.js
import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialMinutes = 25, onComplete) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev === 0) {
            if (minutes === 0) {
              // Timer complete
              setIsRunning(false);
              if (onComplete) {
                onComplete();
              }
              return 0;
            } else {
              setMinutes(m => m - 1);
              return 59;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, minutes, onComplete]);

  const start = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pause = () => {
    setIsPaused(true);
  };

  const resume = () => {
    setIsPaused(false);
  };

  const reset = (newMinutes = initialMinutes) => {
    setIsRunning(false);
    setIsPaused(false);
    setMinutes(newMinutes);
    setSeconds(0);
  };

  const getProgress = () => {
    const totalSeconds = initialMinutes * 60;
    const remainingSeconds = minutes * 60 + seconds;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  };

  return {
    minutes,
    seconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    getProgress
  };
};