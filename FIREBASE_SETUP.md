# Easy Billing — Firebase and run guide

This app uses **Firebase Authentication (Email/Password)** and **Cloud Firestore**. It must be opened over **http://localhost** or **https://** (not `file://`) so Firebase and the PWA service worker work correctly.

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Follow the wizard (Google Analytics optional).

## 2. Enable Authentication

1. In the project, open **Build → Authentication**.
2. Click **Get started**.
3. Under **Sign-in method**, enable **Email/Password**.

## 3. Create a Firestore database

1. Open **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (you will replace rules below) or **test mode** for quick local tests only.
4. Pick a location close to your users.

## 4. Register a web app and copy config

1. Open **Project settings** (gear icon) → **Your apps** → **Web** (`</>`).
2. Register the app and copy the `firebaseConfig` object.
3. Paste the values into [`firebase-config.js`](firebase-config.js) (replace every `YOUR_*` placeholder).

## 5. Authorized domains

1. In **Authentication → Settings → Authorized domains**, ensure **localhost** is listed (it usually is by default).
2. If you deploy to Firebase Hosting or another domain, add that domain here.

## 6. Firestore security rules

**If you see “Missing or insufficient permissions” when saving Settings or invoices**, your rules are still the default (everything blocked) or not published. Do this:

1. Open **Build → Firestore Database → Rules** (not Realtime Database).
2. Replace the entire editor contents with the rules below (or copy from [`firestore.rules`](firestore.rules) in this project folder).
3. Click **Publish** and wait until it finishes (a few seconds).
4. Refresh the app and try **Save settings** again.

In **Firestore → Rules**, use rules like the following so each user only reads and writes their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /meta/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /invoices/{invoiceId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    match /customers/{customerId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

For `create`, `request.resource` is the new document. For `update`/`delete`, you may want to also check `resource.data.userId == request.auth.uid` so users cannot reassign invoices.

Click **Publish** after editing.

## 7. Composite index for invoice history

The **Invoice history** query uses `userId` **and** `date` together, so Firestore needs a **composite index**. Without it you see: *“The query requires an index”* with a long `create_composite=…` link.

**Fastest fix:** click the link Firebase shows in the error (or in the browser console). It opens the index editor with the right fields pre-filled — click **Create index**. Wait until status is **Enabled** (often 1–5 minutes; can be longer). Then refresh the app and open **History** again.

**Manual path:** **Firestore → Indexes → Composite → Add index** — collection `invoices`:

- `userId` — Ascending  
- `date` — Descending  

**Using Firebase CLI (optional):** this repo includes [`firestore.indexes.json`](firestore.indexes.json). From the project folder, after `firebase init firestore` (or with an existing `firebase.json`), run:

`firebase deploy --only firestore:indexes`

## 8. Run the app locally (recommended)

1. Edit `firebase-config.js` with your project keys.
2. **Windows:** double-click **`START.bat`**. It starts a small local web server and opens the app in your browser.
3. **macOS/Linux:** in a terminal, run `chmod +x START.sh && ./START.sh`, or use `python3 -m http.server 8080` and open `http://127.0.0.1:8080/`.

If Python is not installed, install [Python 3](https://www.python.org/downloads/) or use VS Code **Live Server**, or deploy static files to **Firebase Hosting**.

## 9. Optional: Firebase Hosting

1. Install [Firebase CLI](https://firebase.google.com/docs/cli) and run `firebase login`.
2. In this folder, run `firebase init hosting` and point the public directory to this project root (where `index.html` lives).
3. Run `firebase deploy`.

After deployment, add your Hosting domain under **Authentication → Authorized domains**.

## Troubleshooting

- **Blank page / module errors:** Ensure you are not opening `index.html` as `file://`. Use `START.bat` or another local server.
- **“Missing or insufficient permissions” (Settings / Save invoice):** Almost always **Firestore rules**. Follow **section 6** exactly — open **Firestore Database → Rules**, paste the rules, click **Publish**. If you use **production mode** without updating rules, all reads/writes are denied until you publish the rules above.
- **Permission denied on Firestore:** Confirm you are signed in (Auth) and rules match section 6. `request.auth.uid` must match the `users/{uid}` path.
- **“The query requires an index”** (often on **History**): Normal. Use the link in the error, create the index, wait until it is **Enabled**, then reload (see section 7).
