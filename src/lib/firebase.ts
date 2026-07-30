// Firebase lib - simplified, uses the client.ts directly without server functions
export { firestore, firebaseAuth, firebaseAnalytics } from "@/integrations/firebase/client";

// Keep ensureFirebase for backward compat with settings page
export async function ensureFirebase(): Promise<boolean> {
  try {
    const { firestore } = await import("@/integrations/firebase/client");
    firestore(); // Will throw if misconfigured
    return true;
  } catch {
    return false;
  }
}