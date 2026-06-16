import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../src/lib/auth-store';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/lib/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { checkAuth, isLoading } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="admin" />
      </Stack>
    </QueryClientProvider>
  );
}
