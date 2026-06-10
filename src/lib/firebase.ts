import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA7-3Gd_iprWy4USiOhkd7GtijZujh-1xI",
  authDomain: "brandeazy-nfc.firebaseapp.com",
  projectId: "brandeazy-nfc",
  storageBucket: "brandeazy-nfc.firebasestorage.app",
  messagingSenderId: "681818276139",
  appId: "1:681818276139:web:e88922e392a6ad7e94456e"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
