/**
 * App.tsx — Application entry point.
 *
 * Initialises the analytics service and renders the
 * navigation tree. No business logic lives here.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { analyticsService } from './src/services/analytics';

const App: React.FC = () => {
  // Initialise AsyncStorage‑backed analytics on app launch
  useEffect(() => {
    analyticsService.init().catch((err) =>
      console.warn('[App] Analytics init failed:', err),
    );
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
};

export default App;
