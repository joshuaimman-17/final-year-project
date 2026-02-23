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
*   `DATABASE_URL` (Your Supabase Postgres connection string from the "Settings > Database" tab)

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

## 4. Initialize Production Database (Mandatory)

After your first deployment, you must initialize the database tables:
1. Visit `https://your-app-url.vercel.app/api/migrate` in your browser.
2. You should see a JSON message: `{"message":"Database initialized successfully!"}`.
3. This creates the `community_posts`, `users`, and `post_likes` tables required for the community features.

> [!NOTE]
> Ensure that `process.env.NODE_ENV === 'production'` for `next-pwa` to be active. In local development, PWA features are disabled by default.
