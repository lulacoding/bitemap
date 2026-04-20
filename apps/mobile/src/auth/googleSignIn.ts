import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@bitemap/shared';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<void> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'bitemap' });
  const { data, error } = await supabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('No OAuth URL');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  if (result.type === 'success' && result.url) {
    await supabase().auth.exchangeCodeForSession(result.url);
  }
}
