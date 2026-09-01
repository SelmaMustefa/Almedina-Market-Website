import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

// Lazy-initialized Firebase Admin App
let firebaseAdminApp: App | null = null;
let initAttempted = false;

export function getFirebaseAdmin(): App | null {
  if (initAttempted) {
    return firebaseAdminApp;
  }
  initAttempted = true;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

    if (serviceAccountJson) {
      try {
        const credentials = JSON.parse(serviceAccountJson);
        firebaseAdminApp = initializeApp({
          credential: cert(credentials),
          projectId: credentials.project_id || projectId,
        });
        console.log('[FirebaseAdmin] Initialized successfully with Service Account credentials');
        return firebaseAdminApp;
      } catch (parseErr) {
        console.warn('[FirebaseAdmin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', parseErr);
      }
    }

    const apps = getApps();
    if (apps.length > 0) {
      firebaseAdminApp = apps[0]!;
      return firebaseAdminApp;
    }

    // If no credentials provided, do not throw or crash on startup
    console.log('[FirebaseAdmin] Service account not configured. Running in token fallback decoding mode.');
    return null;
  } catch (error: any) {
    console.warn('[FirebaseAdmin] Initialization warning (running in token decoding fallback mode):', error?.message || error);
    return null;
  }
}

