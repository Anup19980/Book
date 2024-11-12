import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAi3bEGWfC_h6Olb1m9JJi2kOGy9QasJl0",
    authDomain: "bookapp-d4f19.firebaseapp.com",
    projectId: "bookapp-d4f19",
    storageBucket: "bookapp-d4f19.firebasestorage.app",
    messagingSenderId: "62929805391",
    appId: "1:62929805391:web:344a2d31c421f8b5a3ca3a",
    measurementId: "G-S8DV648S02"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export { db };
