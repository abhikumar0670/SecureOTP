/**
 * OtpScreen.tsx — OTP entry, countdown timer, and verification.
 *
 * RESPONSIBILITIES:
 * • Display OTP input and a live countdown timer (BONUS).
 * • Show remaining attempts.
 * • Delegate verification to the useOtp custom hook.
 * • Navigate to SessionScreen on successful verification.
 *
 * All business logic (validation, resend, countdown) lives in
 * the useOtp hook — this component is purely presentational.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/auth';
import { useOtp } from '../hooks/useOtp';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

const OtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;

  const {
    otpInput,
    setOtpInput,
    countdown,
    remainingAttempts,
    message,
    verified,
    loading,
    handleVerify,
    handleResend,
  } = useOtp(email);

  // Navigate to Session screen once OTP is verified
  useEffect(() => {
    if (verified) {
      // Small delay so the user sees the success message
      const timeout = setTimeout(() => {
        navigation.replace('Session', { email });
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [verified, email, navigation]);

  // ── Derived display values (no logic in JSX) ─────────────────────

  const countdownColor = countdown <= 10 ? '#EF4444' : '#6B7280';
  const isExpired = countdown <= 0;
  const attemptsExhausted = remainingAttempts <= 0;
  const canVerify = !loading && !verified && !isExpired && !attemptsExhausted;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.logo}>✉️</Text>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6‑digit code to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        {/* Countdown timer (BONUS) */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: countdownColor }]}>
            {isExpired ? 'OTP Expired' : `Expires in ${countdown}s`}
          </Text>
        </View>

        {/* OTP input */}
        <TextInput
          style={styles.input}
          placeholder="Enter 6‑digit OTP"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={6}
          value={otpInput}
          onChangeText={setOtpInput}
          editable={canVerify}
          autoFocus
        />

        {/* Remaining attempts indicator */}
        <Text style={styles.attempts}>
          Attempts remaining: {remainingAttempts} / 3
        </Text>

        {/* Feedback message */}
        {message.length > 0 && <Text style={styles.message}>{message}</Text>}

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.button, !canVerify && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!canVerify}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying…' : verified ? 'Verified ✓' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        {/* Resend button */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={loading || verified}
          activeOpacity={0.7}
        >
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  email: {
    fontWeight: '600',
    color: '#4F46E5',
  },
  timerContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 8,
  },
  attempts: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  resendText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OtpScreen;
