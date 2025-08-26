import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { isLoggedIn } from '@/services/auth';
import './globals.css';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Check auth status when segments change
    checkAuthStatus();
  }, [segments]);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  const checkAuthStatus = async () => {
    try {
      const loggedIn = await isLoggedIn();
      setIsAuthenticated(loggedIn);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  return(
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="(auth)" />
    <Stack.Screen name="movies/[id]" />
  </Stack>  
  );
}
