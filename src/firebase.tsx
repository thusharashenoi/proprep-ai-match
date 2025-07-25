// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'; // ✅ Correct import
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFVMXftqKhQ0G8xzyEim80MW2DLmU4VAM",
  authDomain: "proprepai-41e4d.firebaseapp.com",
  projectId: "proprepai-41e4d",
  storageBucket: "proprepai-41e4d.firebasestorage.app",
  messagingSenderId: "371614504676",
  appId: "1:371614504676:web:40f95faa107c4b6a6c3ef1",
  measurementId: "G-MB7T77Q28B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
