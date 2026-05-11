import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
import os
import sys

# Paths
CRED_PATH = "service-users/firebase-credentials.json"

if not os.path.exists(CRED_PATH):
    print(f"Error: {CRED_PATH} not found.")
    sys.exit(1)

# Initialize Firebase
print("Initializing Firebase Admin SDK...")
cred = credentials.Certificate(CRED_PATH)
firebase_admin.initialize_app(cred, {
    'storageBucket': 'drplant-6f8d1.appspot.com' # From viewing credentials/app config if possible, or usually matches project id
})

def delete_collection(coll_ref, batch_size=50):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f"Deleting document {doc.id} from collection {coll_ref.id}")
        doc.reference.delete()
        deleted = deleted + 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

def clear_auth():
    print("Clearing Firebase Authentication users...")
    users = auth.list_users().iterate_all()
    uids = [user.uid for user in users]
    if uids:
        print(f"Deleting {len(uids)} users...")
        # Delete in batches of 1000
        for i in range(0, len(uids), 1000):
            batch = uids[i:i+1000]
            auth.delete_users(batch)
        print("Firebase Auth cleared.")
    else:
        print("No users found in Firebase Auth.")

def clear_firestore():
    print("Clearing Firestore collections...")
    db = firestore.client()
    collections = db.collections()
    for coll in collections:
        print(f"Wiping collection: {coll.id}")
        delete_collection(coll)
    print("Firestore cleared.")

def clear_storage():
    print("Clearing Firebase Storage...")
    try:
        bucket = storage.bucket()
        blobs = bucket.list_blobs()
        count = 0
        for blob in blobs:
            print(f"Deleting blob: {blob.name}")
            blob.delete()
            count += 1
        print(f"Storage cleared ({count} files deleted).")
    except Exception as e:
        print(f"Storage clearing warning: {e} (Maybe bucket not configured?)")

if __name__ == "__main__":
    clear_auth()
    clear_firestore()
    clear_storage()
    print("Firebase cleanup complete.")
