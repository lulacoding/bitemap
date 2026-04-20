import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@bitemap/shared';
import { colors } from '@bitemap/ui';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase().auth.signUp({ email, password });
    setLoading(false);
    if (error) { Alert.alert('Sign-up failed', error.message); return; }
    Alert.alert('Check your email', 'Click the confirmation link to activate your account.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/sign-in') },
    ]);
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>BiteMap</Text>
      <Text style={s.subtitle}>Create your account</Text>
      <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password (min 6 chars)" value={password} onChangeText={setPassword}
        secureTextEntry />
      <TouchableOpacity style={s.btn} onPress={handleSignUp} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={s.link}>Already have an account? Sign in</Text>
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
  link: { textAlign: 'center', color: colors.primary, marginTop: 8 },
});
