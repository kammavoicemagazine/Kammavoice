const fs = require("fs");
const path = require("path");

// Load .env.local manually
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, ".env.local"), "utf8");
  if (envContent) {
    envContent.split("\n").forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] ? match[2].trim() : "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[match[1]] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local:", e.message);
}

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, deleteDoc, doc } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    console.log("1. Authenticating test admin user...");
    await signInWithEmailAndPassword(auth, "local-test-admin@kammavoice.com", "TestPassword123!");
    console.log("Authenticated successfully!");

    console.log("2. Fetching all articles...");
    const snap = await getDocs(collection(db, "articles"));
    console.log(`Found ${snap.size} total articles.`);

    let deleteCount = 0;
    for (const d of snap.docs) {
      const data = d.data();
      // Delete aggregated articles or local tests
      if (data.isAggregated === true || data.title === "Local Connection Test") {
        console.log(`Deleting article "${data.title}" (ID: ${d.id})...`);
        await deleteDoc(doc(db, "articles", d.id));
        deleteCount++;
      }
    }
    console.log(`Successfully deleted ${deleteCount} articles.`);

    console.log("3. Triggering fresh news aggregation via API route...");
    const response = await fetch("http://localhost:3000/api/cron/aggregate");
    const result = await response.json();
    console.log("Aggregation Result:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
