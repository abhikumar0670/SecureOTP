/**
 * AppNavigator.tsx — Root navigation configuration.
 *
 * Uses React Navigation's native stack for performant,
 * native‑feel screen transitions.
 *
 * The param list is fully typed via RootStackParamList so that
 * every navigation.navigate() call is type‑safe.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/auth';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import SessionScreen from '../screens/SessionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#4F46E5' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'SecureOTP — Login' }}
        />
        <Stack.Screen
          name="Otp"
          component={OtpScreen}
          options={{ title: 'Verify OTP' }}
        />
        <Stack.Screen
          name="Session"
          component={SessionScreen}
          options={{
            title: 'Session',
            // Prevent going back to OTP screen after login
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
