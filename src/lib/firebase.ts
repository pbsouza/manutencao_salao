import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];

// Initialize Firestore with persistent IndexedDB local cache and robust network settings for instant startup
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalForceLongPolling: true,
    },
    config.firestoreDatabaseId || undefined
  );
} catch (e1) {
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      config.firestoreDatabaseId || undefined
    );
  } catch {
    firestoreInstance = config.firestoreDatabaseId
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = firestoreInstance;

export const firebaseApp = app;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type FirebaseUser,
};
