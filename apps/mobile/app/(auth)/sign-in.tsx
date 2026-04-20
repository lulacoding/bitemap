import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@bitemap/shared';
import { signInWithGoogle } from '../../src/auth/googleSignIn';
import { colors } from '@bitemap/ui';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { Alert.alert('Sign-in failed', error.message); return; }
    router.replace('/(app)');
  };

  const handleGoogle = async () => {
    try { await signInWithGoogle(); }
    catch (e: unknown) { Alert.alert('Google sign-in failed', e instanceof Error ? e.message : String(e)); }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>BiteMap</Text>
      <Text style={s.subtitle}>Sign in to your account</Text>
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password" value={password} onChangeText={setPassword}
        secureTextEntry />
      <TouchableOpacity style={s.btn} onPress={handleSignIn} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnOutline} onPress={handleGoogle}>
        <Text style={s.btnOutlineText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
        <Text style={s.link}>No account? Sign up →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  btn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  btnOutline: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnOutlineText: { color: colors.primary, fontWeight: '600' },
  link: { textAlign: 'center', color: colors.primary, marginTop: 8 },
});
