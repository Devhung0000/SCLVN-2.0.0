// js/firebase-init.js
// Khởi tạo Firebase 1 LẦN DUY NHẤT ở đây. Mọi file khác import từ đây,
// KHÔNG initializeApp lại ở nơi khác.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    arrayUnion,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQlxzz9Jc1Fxxi91moGTNChtRz1neGtmQ",
    authDomain: "sclvn-list.firebaseapp.com",
    projectId: "sclvn-list",
    storageBucket: "sclvn-list.firebasestorage.app",
    messagingSenderId: "151402764885",
    appId: "1:151402764885:web:297f68c6d02076a1edd2dc",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export {
    // auth
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    // firestore
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    arrayUnion,
    serverTimestamp,
};
