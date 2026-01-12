// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBCzJGfFdaGVjOgTOKXVwb1tUU955-FcUY",
    authDomain: "restaurantetesis-cda0d.firebaseapp.com",
    projectId: "restaurantetesis-cda0d",
    storageBucket: "restaurantetesis-cda0d.firebasestorage.app",
    messagingSenderId: "1064166351102",
    appId: "1:1064166351102:web:3e2fef6c537f1770a3c5af"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);