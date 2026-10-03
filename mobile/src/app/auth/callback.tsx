import { Redirect } from 'expo-router';

// Google sends people back to kimkloset://auth/callback. The in-app browser usually
// catches that link itself (see signInWithGoogle); this route just stops a "page not found"
// screen if the link ever opens the app directly.
export default function AuthCallback() {
  return <Redirect href="/account" />;
}
