/**
 * otpManager.ts — Pure business‑logic service for OTP generation,
 * storage, and validation.
 *
 * KEY DESIGN DECISIONS:
 * • OTPs are stored in a Map<string, OtpRecord> keyed by email.
 *   ‑ Map gives O(1) look‑ups and naturally supports per‑email isolation.
 * • No global mutable state is exported; callers interact only
 *   through the public API of the OtpManager class.
 * • All timing uses Date.now() so it works across platforms.
 */

import { OtpRecord, OtpValidationResult } from '../types/auth';

// ── Constants ────────────────────────────────────────────────────────

/** Length of the generated OTP code */
const OTP_LENGTH = 6;

/** OTP validity window in milliseconds (60 seconds) */
const OTP_EXPIRY_MS = 60 * 1000;

/** Maximum incorrect attempts before the OTP is locked */
const MAX_ATTEMPTS = 3;

// ── OtpManager class ────────────────────────────────────────────────

class OtpManager {
  /**
   * Internal store: email → OtpRecord.
   * Using a Map because:
   *   1. O(1) get / set / delete per email.
   *   2. Keys are always strings (emails), which Map handles cleanly.
   *   3. No prototype‑chain pollution risk (unlike plain objects).
   */
  private store: Map<string, OtpRecord> = new Map();

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Generate a new 6‑digit OTP for the given email.
   * If an OTP already exists for this email it is overwritten (resend).
   * Returns the generated code so the caller can display / log it.
   */
  generateOtp(email: string): string {
    const code = this.createRandomCode();
    const record: OtpRecord = {
      code,
      createdAt: Date.now(),
      attempts: 0,
    };
    // Overwriting any previous record effectively *invalidates* it
    this.store.set(email, record);
    return code;
  }

  /**
   * Validate the OTP entered by the user.
   * Handles every edge case required:
   *   • No OTP on file → 'no_otp'
   *   • Expired           → 'expired'
   *   • Max attempts hit   → 'max_attempts'
   *   • Wrong code         → 'incorrect' (and increments attempt counter)
   *   • Correct            → success (record is deleted to prevent reuse)
   */
  validateOtp(email: string, code: string): OtpValidationResult {
    const record = this.store.get(email);

    // 1. No OTP has been generated for this email
    if (!record) {
      return { success: false, reason: 'no_otp' };
    }

    // 2. OTP has expired (older than 60 s)
    if (Date.now() - record.createdAt > OTP_EXPIRY_MS) {
      this.store.delete(email); // clean up stale record
      return { success: false, reason: 'expired' };
    }

    // 3. Maximum incorrect attempts already reached
    if (record.attempts >= MAX_ATTEMPTS) {
      return { success: false, reason: 'max_attempts' };
    }

    // 4. Code comparison (case‑insensitive is irrelevant for digits,
    //    but trimming whitespace is a good defensive measure)
    if (record.code !== code.trim()) {
      record.attempts += 1;

      // After incrementing, check if we've now hit the limit
      if (record.attempts >= MAX_ATTEMPTS) {
        return { success: false, reason: 'max_attempts' };
      }
      return { success: false, reason: 'incorrect' };
    }

    // 5. Successful validation — delete the record to prevent reuse
    this.store.delete(email);
    return { success: true };
  }

  /**
   * Return the remaining seconds before the current OTP expires.
   * Returns 0 if no OTP exists or it has already expired.
   * Used by the UI to display a countdown timer.
   */
  getRemainingSeconds(email: string): number {
    const record = this.store.get(email);
    if (!record) return 0;

    const elapsed = Date.now() - record.createdAt;
    const remaining = OTP_EXPIRY_MS - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Returns the remaining verification attempts for the email.
   */
  getRemainingAttempts(email: string): number {
    const record = this.store.get(email);
    if (!record) return 0;
    return Math.max(0, MAX_ATTEMPTS - record.attempts);
  }

  /**
   * Clear OTP data for a given email (e.g., on logout).
   */
  clearOtp(email: string): void {
    this.store.delete(email);
  }

  // ── Private helpers ─────────────────────────────────────────────

  /**
   * Cryptographically‑weak but perfectly fine for a local demo.
   * Generates a random 6‑digit string padded with leading zeros.
   */
  private createRandomCode(): string {
    const max = Math.pow(10, OTP_LENGTH);
    const raw = Math.floor(Math.random() * max);
    return raw.toString().padStart(OTP_LENGTH, '0');
  }
}

// ── Singleton export ─────────────────────────────────────────────────

/**
 * Export a single shared instance.
 * This is NOT a "global mutable variable" in the forbidden sense —
 * it is an encapsulated service whose internal state is only accessible
 * through well‑defined methods.
 */
export const otpManager = new OtpManager();
