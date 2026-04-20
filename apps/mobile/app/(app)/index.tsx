import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@bitemap/shared';
import { useAuth } from '../../src/auth/AuthProvider';
import { colors } from '@bitemap/ui';

export default function Home() {
  const { session } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase().auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Welcome to BiteMap 🎣</Text>
      <Text style={s.email}>{session?.user.email}</Text>
      <TouchableOpacity style={s.btn} onPress={handleSignOut}>
        <Text style={s.btnText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary },
  email: { color: '#555' },
  btn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  btnText: { color: colors.primary },
});
