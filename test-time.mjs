import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAQpPJCr05-I4d5cGa41kr2XWECbatq7Nw",
  authDomain: "cac-summit.firebaseapp.com",
  databaseURL: "https://cac-summit-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cac-summit",
  storageBucket: "cac-summit.firebasestorage.app",
  messagingSenderId: "39772577508",
  appId: "1:39772577508:web:2a655eef52a4a77dff16f1",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function check() {
  console.log("Starting get...");
  const start = Date.now();
  const snapshot = await get(ref(db, "chairs"));
  console.log(`Finished get in ${Date.now() - start}ms`);
  process.exit(0);
}

check();
