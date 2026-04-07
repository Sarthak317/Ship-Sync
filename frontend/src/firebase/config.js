import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuJEAi1jKipDHSVKBR0-jdcp_Ar3MwW9g",
  authDomain: "shipment-tracker-f4e60.firebaseapp.com",
  projectId: "shipment-tracker-f4e60",
  storageBucket: "shipment-tracker-f4e60.firebasestorage.app",
  messagingSenderId: "524857134184",
  appId: "1:524857134184:web:464f00a4bf47d019473fdd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);