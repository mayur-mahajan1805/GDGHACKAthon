# Voice2Action — Government Dashboard

> **Hackathon Project** — Government-facing civic issue management dashboard. Reads from the same Firestore project as the citizen reporting app.

---

## Quick Start

### 1. Install Node.js
Download from https://nodejs.org (v18+ required).

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env.local` and fill in your keys:
```bash
cp .env.example .env.local
```

### 4. Start the dev server
```bash
npm run dev
```
Open http://localhost:5173

---

## Demo Login

| Email | Password |
|---|---|
| `official@voice2action.gov` | `demo1234` |

> Create this account in your Firebase Console under **Authentication → Users** before first login, OR use the auto-seeding: if the `complaints` Firestore collection is empty on first load, 12 sample complaints will be auto-inserted.

---

## Environment Variables

See `.env.example` for all required variables.

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs & Services → Credentials |

### Google Maps Setup
Enable these APIs in your Google Cloud project:
- Maps JavaScript API
- Visualization API (for heatmap)

---

## Architecture

```
src/
├── firebase.js              # Firebase init
├── config/
│   └── wardVulnerability.js # Ward vulnerability index (placeholder for census data)
├── utils/
│   ├── priorityScore.js     # Client-side priority formula
│   └── seedData.js          # 12 sample complaints for demo
├── hooks/
│   ├── useAuth.js           # Firebase Auth state
│   └── useComplaints.js     # Firestore real-time listener
├── components/
│   ├── auth/LoginPage.jsx
│   ├── layout/AppShell.jsx
│   ├── layout/StatsBar.jsx
│   ├── map/MapView.jsx      # Google Map + heatmap toggle
│   ├── list/ComplaintTable.jsx
│   ├── detail/DetailPanel.jsx
│   └── shared/              # FilterBar, badges, PriorityBar
└── pages/Dashboard.jsx      # Map+List tabs with shared state
```

---

## Priority Score Formula

```
priority_score =
  (urgency_score × 0.5) +
  (repeat_count_in_ward_and_category × 10 × 0.3) +
  (vulnerability_weight_for_ward × 0.2)
```

- **urgency_score**: from the citizen app (0–100)
- **repeat_count**: live count of other `new`/`assigned` complaints in same ward + category
- **vulnerability_weight**: from `src/config/wardVulnerability.js` (0–10 scale, placeholder)

---

## Deployment

### Firebase Firestore Rules
Ensure your Firestore rules allow authenticated reads/writes to `complaints`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /complaints/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Build for production
```bash
npm run build
```
Deploy the `dist/` folder to Firebase Hosting, Vercel, or any static host.
