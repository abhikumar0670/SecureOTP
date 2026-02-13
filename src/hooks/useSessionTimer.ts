/**
 * useSessionTimer.ts — Custom hook that provides a live session timer.
 *
 * DESIGN GOALS:
 * ─────────────
 * 1. Timer must NOT reset on re‑render.
 *    → sessionStartRef (useRef) holds the epoch and never changes between
 *      renders, so the timer always computes from the original start time.
 *
 * 2. Timer must STOP on logout.
 *    → The parent calls `stopTimer()`, which clears the interval and
 *      resets the elapsed state to '00:00'.
 *
 * 3. Timer must CLEAN UP on unmount.
 *    → The useEffect cleanup function calls clearInterval.
 *
 * 4. Timer must survive re‑renders.
 *    → We store the interval ID in a ref and recalculate elapsed time
 *      from the immutable start timestamp on every tick.
 *
 * 5. Handle app background / foreground properly.
 *    → We use AppState listener. Because we calculate elapsed from
 *      Date.now() − startTime on every tick, the displayed time
 *      automatically "catches up" when the app returns to foreground.
 *    → On foreground return we also force an immediate tick so the
 *      user never sees a stale value.
 *
 * BONUS: The session start time is persisted to AsyncStorage so that
 *        if the app is killed and restarted the timer can resume.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { analyticsService } from '../services/analytics';

// ── Helper: format milliseconds → mm:ss ──────────────────────────────

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ── Hook ─────────────────────────────────────────────────────────────

interface UseSessionTimerReturn {
  /** Formatted elapsed time string (mm:ss) */
  elapsed: string;
  /** Raw session start timestamp (epoch ms) */
  sessionStart: number | null;
  /** Call to start the timer (idempotent) */
  startTimer: (persistedStart?: number) => void;
  /** Call to stop the timer and reset display */
  stopTimer: () => void;
}

export const useSessionTimer = (): UseSessionTimerReturn => {
  // ── State ────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState<string>('00:00');

  // ── Refs (survive re‑renders without causing them) ───────────────
  /** Immutable start time — set once per session */
  const sessionStartRef = useRef<number | null>(null);

  /** Interval handle for cleanup */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Tick function (calculates elapsed from start) ────────────────
  const tick = useCallback(() => {
    if (sessionStartRef.current === null) return;
    const diff = Date.now() - sessionStartRef.current;
    setElapsed(formatElapsed(diff));
  }, []);

  // ── Start / Stop API ─────────────────────────────────────────────

  const startTimer = useCallback(
    (persistedStart?: number) => {
      // Prevent double‑start
      if (intervalRef.current) return;

      const start = persistedStart ?? Date.now();
      sessionStartRef.current = start;

      // Persist to AsyncStorage so we can recover after app kill
      analyticsService.saveSessionStart(start);

      // Immediate first tick so user doesn't see 00:00 for 1 s
      tick();

      // Update every second
      intervalRef.current = setInterval(tick, 1000);
    },
    [tick],
  );

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    sessionStartRef.current = null;
    setElapsed('00:00');

    // Clear persisted session
    analyticsService.clearSession();
  }, []);

  // ── AppState listener (background / foreground) ──────────────────
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && sessionStartRef.current !== null) {
        // Force an immediate tick when returning to foreground
        // so the displayed time catches up instantly.
        tick();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription.remove();
    };
  }, [tick]);

  // ── Cleanup interval on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    elapsed,
    sessionStart: sessionStartRef.current,
    startTimer,
    stopTimer,
  };
};
