import { useState, useEffect, useCallback } from 'react';

export default function useSleepTimer(onExpire: () => void) {
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  const startTimer = useCallback((minutes: number) => {
    setTargetTime(Date.now() + minutes * 60 * 1000);
  }, []);

  const cancelTimer = useCallback(() => {
    setTargetTime(null);
    setRemainingTime(null);
  }, []);

  useEffect(() => {
    if (!targetTime) return;

    const interval = setInterval(() => {
      const remainingMs = targetTime - Date.now();
      
      if (remainingMs <= 0) {
        setTargetTime(null);
        setRemainingTime(null);
        onExpire();
        return;
      }

      const totalSeconds = Math.ceil(remainingMs / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      setRemainingTime(`${m}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onExpire]);

  return {
    isActive: targetTime !== null,
    remainingTime,
    startTimer,
    cancelTimer
  };
}
