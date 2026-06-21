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

async function checkData() {
  const snap = await get(ref(db, "committee-data"));
  console.log(JSON.stringify(snap.val(), null, 2));
  process.exit(0);
}

checkData();
