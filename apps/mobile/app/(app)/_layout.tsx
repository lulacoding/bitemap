import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  return <Slot />;
}
