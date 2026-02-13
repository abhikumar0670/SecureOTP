/**
 * LoginScreen.tsx — Email input + "Send OTP" button.
 *
 * RESPONSIBILITIES:
 * • Collect the user's email address.
 * • Validate email format before proceeding.
 * • Generate a local 6‑digit OTP via otpManager.
 * • Log the 'otp_generated' analytics event.
 * • Navigate to the OtpScreen with the email as a param.
 *
 * All business logic lives in services; this component
 * only orchestrates UI → service → navigation.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/auth';
import { otpManager } from '../services/otpManager';
import { analyticsService } from '../services/analytics';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ── Simple email regex for validation ────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Memoize validity so it doesn't recalculate on every render
  // unless `email` changes.
  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);

  /**
   * Handle the "Send OTP" button press.
   * Generates OTP, logs the event, and navigates.
   */
  const handleSendOtp = useCallback(async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isEmailValid) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // Generate OTP (stored per email inside the manager)
      const code = otpManager.generateOtp(trimmedEmail);

      // In a real app, this OTP would be sent via email/SMS.
      // For this local demo we log it to the console.
      console.log(`[DEV] OTP for ${trimmedEmail}: ${code}`);

      // Log analytics event
      await analyticsService.logEvent('otp_generated', trimmedEmail);

      // Show OTP in development for easy testing
      if (__DEV__) {
        Alert.alert('DEV: OTP Generated', `Your OTP is: ${code}`, [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Otp', { email: trimmedEmail }),
          },
        ]);
      } else {
        navigation.navigate('Otp', { email: trimmedEmail });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate OTP. Please try again.');
      console.error('[LoginScreen] handleSendOtp error:', error);
    } finally {
      setLoading(false);
    }
  }, [email, isEmailValid, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>SecureOTP</Text>
        <Text style={styles.subtitle}>Enter your email to receive a one‑time password</Text>

        {/* Email input */}
        <TextInput
          style={[styles.input, !isEmailValid && email.length > 0 && styles.inputError]}
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        {/* Validation hint */}
        {!isEmailValid && email.length > 0 && (
          <Text style={styles.errorText}>Please enter a valid email address</Text>
        )}

        {/* Send OTP button */}
        <TouchableOpacity
          style={[styles.button, (!isEmailValid || loading) && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={!isEmailValid || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{loading ? 'Sending…' : 'Send OTP'}</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
