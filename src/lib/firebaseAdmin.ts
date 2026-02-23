import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const getServiceAccount = () => {
    const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envServiceAccount) {
        try {
            console.log("Firebase Admin: Attempting to load service account from environment variable");
            return JSON.parse(envServiceAccount);
        } catch (e) {
            console.error('Firebase Admin: Failed to parse FIREBASE_SERVICE_ACCOUNT env variable');
        }
    }

    try {
        const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(keyPath)) {
            console.log("Firebase Admin: Loading service account from serviceAccountKey.json");
            const keyContent = fs.readFileSync(keyPath, 'utf8');
            return JSON.parse(keyContent);
        }
    } catch (e) {
        console.error('Firebase Admin: Failed to read serviceAccountKey.json from disk');
    }
    console.warn("Firebase Admin: No service account found in env or disk. Using default credentials.");
    return null;
};

const serviceAccount = getServiceAccount();

if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (serviceAccount ? serviceAccount.project_id : undefined);

    if (serviceAccount) {
        console.log("Firebase Admin: Initializing with service account cert");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId,
        });
    } else {
        console.log("Firebase Admin: Initializing with default app credentials");
        admin.initializeApp({
            projectId: projectId,
        });
    }
    console.log(`Firebase Admin: Initialization complete for project: ${projectId}`);
} else {
    // Check for project mismatch in hot-reloading scenarios
    const currentApp = admin.app();
    const targetProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (serviceAccount ? serviceAccount.project_id : undefined);

    if (currentApp.options.projectId !== targetProjectId) {
        console.log(`Firebase project mismatch detected. Re-initializing from ${currentApp.options.projectId} to ${targetProjectId}`);
        // Synchronous delete and re-init for server-side stability in dev
        // Note: In production, app.delete() is async, but for dev re-init this is often okay
        try {
            // Using internal methods or just continuing if delete is pending
            // For safety, we can just use the new project in subsequent calls if possible,
            // but firebase-admin usually requires a single app.
            // We'll proceed with deletion.
            // @ts-ignore
            admin.app().delete();

            if (serviceAccount) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: targetProjectId,
                });
            } else {
                admin.initializeApp({
                    projectId: targetProjectId,
                });
            }
        } catch (e) {
            console.error('Error re-initializing Firebase Admin:', e);
        }
    }
}

export const authAdmin = admin.auth();
export default admin;
