/**
 * useOtp.ts — Custom hook encapsulating all OTP‑related UI logic.
 *
 * Keeps the OtpScreen component thin by extracting:
 *   • countdown timer state
 *   • attempt tracking
 *   • resend logic
 *   • validation orchestration
 *
 * This is the BONUS "Custom hook for OTP logic" from the requirements.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { otpManager } from '../services/otpManager';
import { analyticsService } from '../services/analytics';
import { OtpValidationResult } from '../types/auth';

interface UseOtpReturn {
  /** User‑entered OTP value */
  otpInput: string;
  setOtpInput: (v: string) => void;
  /** Seconds remaining before current OTP expires */
  countdown: number;
  /** Remaining verification attempts */
  remainingAttempts: number;
  /** Feedback message shown to the user */
  message: string;
  /** Whether verification succeeded (triggers navigation) */
  verified: boolean;
  /** Whether the form is currently processing */
  loading: boolean;
  /** Handle verify button press */
  handleVerify: () => Promise<void>;
  /** Handle resend button press */
  handleResend: () => Promise<void>;
}

export const useOtp = (email: string): UseOtpReturn => {
  const [otpInput, setOtpInput] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Interval ref for the countdown timer */
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start countdown on mount & on resend ──────────────────────────

  const startCountdown = useCallback(() => {
    // Clear any existing timer
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Initialize from the manager (in case there's a slight time diff)
    setCountdown(otpManager.getRemainingSeconds(email));

    countdownRef.current = setInterval(() => {
      const remaining = otpManager.getRemainingSeconds(email);
      setCountdown(remaining);
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 1000);
  }, [email]);

  // Start countdown when the hook mounts
  useEffect(() => {
    startCountdown();
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [startCountdown]);

  // ── Verify handler ────────────────────────────────────────────────

  const handleVerify = useCallback(async () => {
    if (!otpInput.trim()) {
      setMessage('Please enter the OTP.');
      return;
    }

    setLoading(true);
    const result: OtpValidationResult = otpManager.validateOtp(email, otpInput);

    if (result.success) {
      setMessage('✅ OTP verified successfully!');
      setVerified(true);
      await analyticsService.logEvent('otp_validation_success', email);
    } else {
      // Map failure reasons to user‑friendly messages
      const reasonMessages: Record<string, string> = {
        expired: '⏰ OTP has expired. Please resend.',
        incorrect: '❌ Incorrect OTP. Please try again.',
        max_attempts: '🚫 Maximum attempts exceeded. Please resend OTP.',
        no_otp: '⚠️ No OTP found. Please go back and request one.',
      };
      setMessage(reasonMessages[result.reason]);
      setRemainingAttempts(otpManager.getRemainingAttempts(email));
      await analyticsService.logEvent('otp_validation_failure', email, {
        reason: result.reason,
      });
    }

    setLoading(false);
  }, [email, otpInput]);

  // ── Resend handler ────────────────────────────────────────────────

  const handleResend = useCallback(async () => {
    // Generate new OTP (invalidates the old one automatically)
    const newCode = otpManager.generateOtp(email);
    console.log(`[DEV] New OTP for ${email}: ${newCode}`);

    // Reset local state
    setOtpInput('');
    setMessage(`🔄 New OTP sent! (DEV: ${newCode})`);
    setRemainingAttempts(3);
    startCountdown();

    await analyticsService.logEvent('otp_generated', email, { resend: true });
  }, [email, startCountdown]);

  return {
    otpInput,
    setOtpInput,
    countdown,
    remainingAttempts,
    message,
    verified,
    loading,
    handleVerify,
    handleResend,
  };
};
