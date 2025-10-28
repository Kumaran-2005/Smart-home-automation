# Smart Home Dashboard (Simple Frontend)

This is a small static frontend for a Smart Home Dashboard that connects to a Firebase Realtime Database.

What this repository contains
- `index.html` - Single-file frontend that handles login (Firebase Auth) and reads/writes device values from/to the Realtime Database.

Quick features
- Login using Firebase Email/Password auth
- Real-time status for lights, fan, door, motion, temperature, and humidity
- Simple controls to toggle devices and open/close door

Run locally
Option A — quick (no install):

1. Open `index.html` in a modern browser (Chrome/Edge/Firefox).

Option B — recommended (local server):

1. Install dependencies and run the dev server:

```powershell
npm install
npm start
```

2. Open http://127.0.0.1:8080 in your browser.

Firebase notes
- The project includes a Firebase config in `index.html`. That config allows the page to connect to a specific Firebase project. If you want to use your own Firebase project, replace the `firebaseConfig` object in `index.html` with your project's settings and ensure Realtime Database rules and Authentication are configured.

Backend (Express + Firebase Admin)
---------------------------------

This repository now includes a small Express backend (`server.js`) that uses the Firebase Admin SDK to read and write values in the Realtime Database. The server also serves the static `index.html` so you can run everything from a single process.

Setup steps
1. Create a Firebase service account JSON file:
	- In the Firebase Console, go to Project Settings > Service accounts.
	- Click "Generate new private key" and download the JSON file.
	- Save it as `serviceAccountKey.json` in the project root (next to `server.js`) OR set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the file path.

2. Set your Realtime Database URL in the environment or the service account file. You can set the `DATABASE_URL` environment variable, for example:

```powershell
$env:DATABASE_URL = 'https://your-db-name.firebaseio.com'
```

3. Install dependencies and start the server:

```powershell
npm install
npm start
```

4. Open http://127.0.0.1:8080 in your browser.

Demo mode (no Firebase required)
--------------------------------
If you don't have Firebase credentials or want to run the app locally without connecting to Firebase, there's a demo mode. It bypasses Firebase auth and uses an in-memory mock database so you can test the UI and device toggles.

- Start the server as above (`npm install`, `npm start`).
- Open the demo URL:

```powershell
http://127.0.0.1:8080/?demo=1
```

The dashboard will open with simulated sensor values and you can use the device buttons to toggle state locally.

APIs provided
- GET /api/devices — returns the full database root snapshot
- GET /api/device/:id — returns the value for the given key (e.g. `/api/device/Light1`)
- POST /api/device/:id — set value for the given key with JSON body `{ "value": <value> }`

Security
- The Express backend requires a Firebase service account to write to your database. Protect your `serviceAccountKey.json` — do not commit it to source control. Add `serviceAccountKey.json` to `.gitignore` if you create it.

Notes
- The frontend still includes a Firebase client config in `index.html`. You can continue to use the frontend with Firebase directly, or modify the frontend to call the new backend endpoints instead. If you want, I can update the frontend to use the backend API (recommended when you want to centralize rules and to avoid exposing client-side DB writes directly).

Security note
- Firebase client keys are public configuration values — they are safe to include in frontend code, but make sure your Realtime Database rules restrict access appropriately (e.g., require authentication) to prevent unauthorized writes.

Next steps / Improvements
- Add user registration, password reset, and better error handling
- Add tests and minor UI polish
- Add bundling/build step if the project grows

License
- MIT

## Publishing & deployment

Below are step-by-step options to publish your code to GitHub and to host the frontend or the full app.

A) Publish repository to GitHub (push your code)

1. Create a repository on GitHub (https://github.com) — do not initialize with a README since you already have one.
2. In PowerShell (from the project root) run the following (replace placeholders):

```powershell
git init
git add .
git commit -m "Initial commit - Smart Home Dashboard"
# replace with your username and repo name
git remote add origin https://github.com/<your-username>/<repo>.git
git branch -M main
git push -u origin main
```

If you have the GitHub CLI installed (`gh`), you can create and push in one step:

```powershell
gh repo create <your-username>/<repo> --public --source=. --remote=origin --push
```

B) Host the static frontend on GitHub Pages (demo UI only)

This is useful if you only want to publish the UI (demo mode or client-side Firebase). It will not run the Node backend.

1. Option — publish `gh-pages` branch:

```powershell
# Create a branch that contains only the static site (index.html)
git checkout --orphan gh-pages
git reset --hard
git add index.html
git commit -m "Publish frontend to GitHub Pages"
git push -u origin gh-pages --force
git checkout main
```

2. On GitHub, open your repository → Settings → Pages and set the Source to the `gh-pages` branch. GitHub will provide a URL like `https://<username>.github.io/<repo>/`.

You can then open the demo UI at:

```
https://<username>.github.io/<repo>/?demo=1
```

C) Deploy the full Node app (Express + Firebase Admin)

Use a Node host such as Render, Railway, Fly, Heroku, or Vercel (server support). General steps:

1. Push your repo to GitHub (see section A).
2. On the host, create a new Web Service and connect your GitHub repo.
3. Set the start command to:

```
npm install && npm start
```

4. Configure environment variables on the host instead of committing secrets:

- `DATABASE_URL` = `https://your-db-name.firebaseio.com`
- `GOOGLE_APPLICATION_CREDENTIALS` or provide the service account JSON using the host's secret storage (do not add `serviceAccountKey.json` to the repo).

5. Deploy. The host will give you a public URL.

Note: different hosts have different ways of supplying a JSON secret — follow their docs to securely provide the Firebase service account.

D) Useful npm scripts included

- `npm start` — run the server (existing)
- `npm run dev` — run with `nodemon` (existing)
- `npm run test:headless` — run the Puppeteer headless test (`tools/headless-test.js`)
- `npm run publish:pages` — (requires `gh-pages` devDependency) publishes the repository root to GitHub Pages

E) Security checklist before publishing

- Ensure `.gitignore` contains `serviceAccountKey.json` (this repo already includes a `.gitignore`).
- Run `git status` and `git diff` to verify no secrets are staged.
- If you accidentally committed secrets, do not push — ask and I can help remove them from history safely.

If you'd like, I can:
- Add a one-click `gh-pages` setup to `package.json` (already added a helper script).
- Create a short GitHub Actions workflow that runs `npm ci` and the headless test (I can add this, but Puppeteer may need extra setup in Actions).
- Walk through deploying to Render or Railway step-by-step for your GitHub repo.

