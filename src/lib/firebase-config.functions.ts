// Firebase config is now embedded in src/integrations/firebase/client.ts
// This file is kept for backward compatibility but is no longer used.
// The server function pattern is replaced by direct Firebase SDK initialization.

export const getFirebaseConfig = async () => ({
  configured: true,
  config: {
    apiKey: "AIzaSyDXXTvyTSCdbPD8WNCJVqWY3qjr6t5ktV4",
    authDomain: "f1-commander.firebaseapp.com",
    projectId: "f1-commander",
    storageBucket: "f1-commander.firebasestorage.app",
    messagingSenderId: "358371046919",
    appId: "1:358371046919:web:6e2da6f60f28320d879ca2",
    measurementId: "G-39W8QMK9ZJ",
  },
});