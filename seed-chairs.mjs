import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

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

async function seed() {
  await set(ref(db, "chairs/chair-saif"), { name: "Saif-Eldeen", createdAt: 1750000000000 });
  await set(ref(db, "chairs/chair-judy"), { name: "Judy", createdAt: 1750000000000 });
  console.log("Seeded chairs.");
  process.exit(0);
}

seed();
