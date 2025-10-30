import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// TODO: Replace with your Firebase config from Step 2.3
const firebaseConfig = {
  apiKey: "AIzaSyCJNwYDNbhicVCZmQ1T9kNaK_5fsIaEeg0",
  authDomain: "pomodoro-timer-app-c9894.firebaseapp.com",
  projectId: "pomodoro-timer-app-c9894",
  storageBucket: "pomodoro-timer-app-c9894.firebasestorage.app",
  messagingSenderId: "462249123793",
  appId: "1:462249123793:web:5bedfd4f42aafa67034af0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();