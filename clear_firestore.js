const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return;

  let deletedCount = 0;
  const batchSize = 400;
  let batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    // Recursively delete subcollections
    const subcollections = await doc.ref.listCollections();
    for (const sub of subcollections) {
      await deleteCollection(sub);
    }

    batch.delete(doc.ref);
    count++;
    deletedCount++;

    if (count >= batchSize) {
      await batch.commit();
      console.log(`  Deleted ${deletedCount} documents so far in ${collectionRef.path}...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`  ✅ Deleted ${deletedCount} documents from ${collectionRef.path}`);
}

async function clearAllCollections() {
  console.log('📦 Fetching top-level collections...');
  const collections = await db.listCollections();

  if (collections.length === 0) {
    console.log('No collections found.');
    return;
  }

  for (const col of collections) {
    console.log(`\n🗑️  Clearing collection: ${col.id}`);
    await deleteCollection(col);
  }

  console.log('\n✅ All documents deleted. Collections are preserved.');
  process.exit(0);
}

clearAllCollections().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
