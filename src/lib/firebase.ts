import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBmP6Zv-FwG2u3QZLwmJCKd0fZZYxhj3bg",
  authDomain: "glassy-shape-t18qq.firebaseapp.com",
  projectId: "glassy-shape-t18qq",
  storageBucket: "glassy-shape-t18qq.firebasestorage.app",
  messagingSenderId: "771042966249",
  appId: "1:771042966249:web:d1909e709f30926396ce78"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-74491874-b09f-4ea8-ad44-e284faf8c4d3");

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Native Google Sign In flow helper
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('[FlowSpace Firebase] Sign In Failed:', error);
    throw error;
  }
};

// Logout helper
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[FlowSpace Firebase] Logout Failed:', error);
    throw error;
  }
};

export interface CloudData {
  profile?: any;
  todos?: any[];
  notes?: any[];
  habits?: any[];
  projects?: any[];
  focusSessions?: any[];
}

// Fetch all workspace blocks for a specific user
export const fetchCloudData = async (userId: string): Promise<CloudData | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as CloudData;
    }
    return null;
  } catch (error) {
    console.error('[FlowSpace Sync] Error fetching cloud data:', error);
    return null;
  }
};

// Update workspace blocks incrementally
export const saveCloudData = async (userId: string, data: Partial<CloudData>) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, data, { merge: true });
    console.log('[FlowSpace Sync] Saved successfully to Firebase Cloud Storage.');
  } catch (error) {
    console.error('[FlowSpace Sync] Error saving cloud data:', error);
  }
};

