/**
 * Custom hook for tracking call duration in real-time
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to track call duration
 * @param {boolean} isActive - Whether the call is active
 * @param {Date} startTime - Call start time
 * @returns {Object} Duration state and methods
 */
export const useCallDuration = (isActive = false, startTime = null) => {
  const [duration, setDuration] = useState(0);
  const [formattedDuration, setFormattedDuration] = useState('00:00');
  const intervalRef = useRef(null);
  const startTimeRef = useRef(startTime);

  // Update start time when it changes
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  // Format duration in MM:SS or HH:MM:SS format
  const formatDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, []);

  // Start the timer
  const startTimer = useCallback((customStartTime = null) => {
    const actualStartTime = customStartTime || startTimeRef.current || new Date();
    startTimeRef.current = actualStartTime;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - actualStartTime) / 1000);
      setDuration(elapsed);
      setFormattedDuration(formatDuration(elapsed));
    }, 1000);
  }, [formatDuration]);

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset the timer
  const resetTimer = useCallback(() => {
    stopTimer();
    setDuration(0);
    setFormattedDuration('00:00');
    startTimeRef.current = null;
  }, [stopTimer]);

  // Auto start/stop based on isActive prop
  useEffect(() => {
    if (isActive && startTimeRef.current) {
      startTimer();
    } else if (!isActive) {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [isActive, startTimer, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    duration,
    formattedDuration,
    startTimer,
    stopTimer,
    resetTimer,
    isRunning: !!intervalRef.current
  };
};
