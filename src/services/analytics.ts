/**
 * analytics.ts — Lightweight analytics service backed by AsyncStorage.
 *
 * WHY AsyncStorage?
 * ─────────────────
 * 1. It is the de‑facto key–value persistence API in React Native / Expo.
 * 2. It survives app restarts, which means analytics logs are never lost
 *    even if the user kills the app before we could "flush" them.
 * 3. It is async / non‑blocking, so writing logs never freezes the UI.
 * 4. No native setup required in Expo — works out of the box.
 *
 * Each event is appended to a JSON array stored under the key
 * `@SecureOTP:analytics`.  The service also exposes helpers to
 * persist and retrieve the session start time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, AnalyticsPayload } from '../types/auth';

// ── Storage keys ─────────────────────────────────────────────────────

const ANALYTICS_KEY = '@SecureOTP:analytics';
const SESSION_KEY = '@SecureOTP:session_start';

// ── Analytics service ────────────────────────────────────────────────

class AnalyticsService {
  /**
   * Initialization flag.
   * We load any existing logs from AsyncStorage once on first use.
   */
  private initialized = false;

  /** In‑memory cache so we don't read from disk on every write. */
  private logs: AnalyticsPayload[] = [];

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Lazily initializes the service by reading persisted logs.
   * Idempotent — safe to call multiple times.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
      if (raw) {
        this.logs = JSON.parse(raw) as AnalyticsPayload[];
      }
    } catch (error) {
      // If storage is corrupted we start fresh
      console.warn('[Analytics] Failed to load persisted logs:', error);
      this.logs = [];
    }

    this.initialized = true;
  }

  // ── Event logging ───────────────────────────────────────────────

  /**
   * Log an analytics event and persist it to AsyncStorage.
   *
   * @param event - The event type (e.g. 'otp_generated')
   * @param email - The email associated with the event
   * @param meta  - Optional extra data (e.g. { reason: 'expired' })
   */
  async logEvent(
    event: AnalyticsEvent,
    email: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    await this.init();

    const payload: AnalyticsPayload = {
      event,
      email,
      timestamp: Date.now(),
      ...(meta ? { meta } : {}),
    };

    this.logs.push(payload);

    try {
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('[Analytics] Failed to persist event:', error);
    }

    // Also log to console during development for easy debugging
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, { email, meta });
    }
  }

  // ── Session persistence ─────────────────────────────────────────

  /**
   * Persist the session start timestamp so it survives app restarts.
   */
  async saveSessionStart(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEY, timestamp.toString());
    } catch (error) {
      console.warn('[Analytics] Failed to save session start:', error);
    }
  }

  /**
   * Retrieve the persisted session start timestamp.
   * Returns null if no session is active.
   */
  async getSessionStart(): Promise<number | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? parseInt(raw, 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear the persisted session (called on logout).
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('[Analytics] Failed to clear session:', error);
    }
  }

  // ── Debug helpers ───────────────────────────────────────────────

  /**
   * Return all recorded analytics events (useful for debugging / tests).
   */
  async getAllLogs(): Promise<AnalyticsPayload[]> {
    await this.init();
    return [...this.logs];
  }
}

// ── Singleton export ─────────────────────────────────────────────────

export const analyticsService = new AnalyticsService();
