# Vercel Deployment Guide for Dr.Plant

Follow these steps to deploy your unified Next.js PWA to Vercel.

## 1. Prepare Your Environment Variables

Login to your Vercel Dashboard and add the following Environment Variables for your project:

### Firebase Configuration (Public)
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`

### Third-Party APIs
*   `NEXT_PUBLIC_AGRO_API_KEY`
*   `NEXT_PUBLIC_TREFLE_TOKEN`
*   `DATABASE_URL` (Your Neon Postgres connection string)

### Firebase Admin (Private)
> [!IMPORTANT]
> **FIREBASE_SERVICE_ACCOUNT**: Copy the entire content of your `serviceAccountKey.json` and paste it as the value for this variable. This allows the application to securely authenticate with Firebase on the server without committing the sensitive file to Git.

## 2. Deploy via Vercel CLI or Git

### Option A: Vercel CLI (Fastest)
1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in the project root (`dr-plant-nextjs`).
3. Follow the prompts to link your account and deploy.

### Option B: Git Integration (Recommended for CI/CD)
1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Import the project in Vercel.
3. Configure the environment variables during the import process.

## 3. Verify PWA Support

After deployment, visit your site using a mobile browser. You should be prompted to "Add to Home Screen," and the service worker should be active, allowing the app to work offline.

> [!NOTE]
> Ensure that `process.env.NODE_ENV === 'production'` for `next-pwa` to be active. In local development with the `--webpack` flag, PWA features are disabled by default to speed up builds.
