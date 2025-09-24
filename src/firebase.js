// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue, set } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCx0_lUYLsCuykWvqBjeeSze9vPTA2nt3g",
  authDomain: "absensi-organisasi.firebaseapp.com",
  databaseURL: "https://absensi-organisasi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-organisasi",
  storageBucket: "absensi-organisasi.firebasestorage.app",
  messagingSenderId: "600459147690",
  appId: "1:600459147690:web:cb4343f0dc5e2e654313d3",
  measurementId: "G-4DZW2ZEYHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

export {db, ref, onValue, set};

