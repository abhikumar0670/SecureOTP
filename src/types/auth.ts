/**
 * auth.ts — Central type definitions for the SecureOTP app.
 *
 * All shared interfaces and type aliases live here so that
 * screens, services, and hooks reference a single source of truth.
 */

// ── OTP‑related types ──────────────────────────────────────────────

/** Represents the stored state of an OTP issued to a specific email. */
export interface OtpRecord {
  /** The 6‑digit OTP code */
  code: string;
  /** Epoch timestamp (ms) when the OTP was generated */
  createdAt: number;
  /** Number of failed verification attempts so far */
  attempts: number;
}

/** Possible outcomes when verifying an OTP. */
export type OtpValidationResult =
  | { success: true }
  | { success: false; reason: 'expired' | 'incorrect' | 'max_attempts' | 'no_otp' };

// ── Navigation param list ───────────────────────────────────────────

/**
 * Typed param list consumed by React Navigation.
 * Each key is a route name; its value is the params object (or undefined).
 */
export type RootStackParamList = {
  Login: undefined;
  Otp: { email: string };
  Session: { email: string };
};

// ── Analytics event types ───────────────────────────────────────────

/** The analytics events that must be logged throughout the app. */
export type AnalyticsEvent =
  | 'otp_generated'
  | 'otp_validation_success'
  | 'otp_validation_failure'
  | 'logout';

/** Payload shape stored per analytics event. */
export interface AnalyticsPayload {
  event: AnalyticsEvent;
  email: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}
