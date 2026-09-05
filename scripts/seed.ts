import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import { INITIAL_LOANS, INITIAL_TRANSACTIONS } from "../src/lib/loansData";

const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function seed() {
  console.log("Seeding loans to Firestore...");
  for (const loan of INITIAL_LOANS) {
    await setDoc(doc(db, "loans", loan.id), loan);
    console.log(`Uploaded loan: ${loan.id}`);
  }
  
  console.log("Seeding transactions to Firestore...");
  for (const tx of INITIAL_TRANSACTIONS) {
    await setDoc(doc(db, "transactions", tx.id), tx);
    console.log(`Uploaded transaction: ${tx.id}`);
  }
  console.log("Done seeding Firestore.");
  process.exit(0);
}

seed().catch(console.error);
