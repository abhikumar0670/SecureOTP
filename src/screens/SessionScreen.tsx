/**
 * SessionScreen.tsx — Displays session info after successful login.
 *
 * RESPONSIBILITIES:
 * • Show the session start time (formatted).
 * • Show a live session duration timer in mm:ss.
 * • Provide a Logout button that stops the timer and navigates back.
 * • Recover session from AsyncStorage if the app was killed & restarted.
 *
 * The timer logic is fully encapsulated in the useSessionTimer hook.
 * This component only reads the hook's return values and renders them.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/auth';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { analyticsService } from '../services/analytics';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

const SessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const { elapsed, startTimer, stopTimer } = useSessionTimer();

  // Local state for the session start timestamp (for display)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // ── Initialise session on mount ───────────────────────────────────

  useEffect(() => {
    const initSession = async () => {
      // Try to recover a persisted session (BONUS)
      const persisted = await analyticsService.getSessionStart();

      if (persisted) {
        // Resume from where we left off
        setSessionStartTime(persisted);
        startTimer(persisted);
      } else {
        // Fresh session
        const now = Date.now();
        setSessionStartTime(now);
        startTimer(now);
      }
    };

    initSession();
    // startTimer is stable (wrapped in useCallback), so this is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Formatted session start (derived, no logic in JSX) ───────────

  const formattedStart = useMemo(() => {
    if (!sessionStartTime) return '—';
    return new Date(sessionStartTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [sessionStartTime]);

  const formattedDate = useMemo(() => {
    if (!sessionStartTime) return '';
    return new Date(sessionStartTime).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [sessionStartTime]);

  // ── Logout handler ────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // Stop the session timer (also clears persisted session)
          stopTimer();

          // Log the analytics event
          await analyticsService.logEvent('logout', email);

          // Navigate back to Login and reset the stack
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  }, [email, navigation, stopTimer]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* User avatar placeholder */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {email.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.greeting}>Welcome!</Text>
        <Text style={styles.email}>{email}</Text>

        {/* Session info */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Session Started</Text>
          <Text style={styles.infoValue}>{formattedStart}</Text>
          <Text style={styles.infoDate}>{formattedDate}</Text>
        </View>

        {/* Live duration timer */}
        <View style={styles.timerBlock}>
          <Text style={styles.timerLabel}>Session Duration</Text>
          <Text style={styles.timerValue}>{elapsed}</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  infoBlock: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  timerBlock: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4F46E5',
  },
  logoutButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SessionScreen;
