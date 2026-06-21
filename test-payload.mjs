import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyAQpPJCr05-I4d5cGa41kr2XWECbatq7Nw",
  authDomain: "cac-summit.firebaseapp.com",
  databaseURL: "https://cac-summit-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cac-summit",
  storageBucket: "cac-summit.firebasestorage.app",
  messagingSenderId: "39772577508",
  appId: "1:39772577508:web:2a655eef52a4a77dff16f1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const payloadStr = fs.readFileSync("payload.json", "utf-8");
const data = JSON.parse(payloadStr);

async function test() {
  try {
    await set(ref(db, "committee-data/chair-saif"), data);
    console.log("Success!");
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

test();
