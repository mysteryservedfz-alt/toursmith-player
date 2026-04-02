# Toursmith — PRD

## Original Problem Statement
Build an interactive tour player and admin dashboard for "Mystery Served" walking tours. Tours consist of multiple stops with pages, each having different unlock/verification methods. Admins create and manage tours via a dashboard; players experience them on their phones at real-world locations.

## Product Overview
- **App Type:** Tour builder + player (React frontend, FastAPI backend, MongoDB)
- **Users:** Tour creators (admin dashboard) and tour players (public player)
- **Live URL:** https://toursmith-admin.emergent.host
- **Admin Credentials:** demo / demo123

## Core Features (Implemented)

### Admin Dashboard
- Login/auth with JWT
- Create, edit, delete tours
- Grid and list view for tour management
- Stop and page editor with nested structure
- Copy share link (with OG meta tags for link previews)
- QR code generation for tours
- GPS map editor for stops
- Drag-and-drop page reordering

### 8 Verification/Unlock Types
1. **TEXT** — Type a specific word/letter to unlock (case insensitive)
2. **MULTIPLE CHOICE** — Pick from A/B/C/D options
3. **WHITEBOARD** — Type anything, no wrong answer
4. **PHOTO** — Upload any photo to proceed (accepts anything)
5. **RANKING** — Drag items into correct order (shuffled on display)
6. **TIMER** — Countdown auto-unlocks when it hits zero
7. **CHECKLIST** — Check off all tasks to proceed
8. **SHAKE** — Shake phone to unlock (tap fallback for desktop)
9. **CONTINUE** — No gate, just tap Next

### Player Features
- Welcome screen with custom button label
- Completion/shakedown screen
- Inline unlock gates (clue text visible above input)
- Themed instrument dividers (guitar, banjo, violin, music notes)
- Dynamic browser tab title (shows tour name)
- Hint system
- Progress tracking (% complete)
- Previous/Next navigation
- localStorage progress saving (24h expiry)
- Custom correct/wrong answer messages
- Auto-advance after correct answer

### Share Links with OG Meta Tags
- `/api/share/{tour_id}` serves HTML with Open Graph tags
- Link previews show tour name and description in iMessage, Slack, Instagram, etc.
- Auto-redirects to player

## Architecture
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py            # FastAPI (auth, CRUD, share endpoint)
└── frontend/
    ├── package.json
    └── src/
        ├── App.css           # All styles including player themes
        ├── App.js            # Admin dashboard, editor, auth (~2943 lines)
        ├── index.css         # Tailwind setup
        └── components/
            ├── PlayerLayout.jsx      # Main player orchestrator
            ├── PlayerWelcome.jsx     # Welcome screen
            ├── PlayerCompletion.jsx  # Completion overlay + confetti
            ├── UnlockGate.jsx        # All 8 unlock mode UIs
            ├── ContentRenderer.jsx   # Content rendering + embed helpers
            └── usePlayerProgress.js  # localStorage progress hook
```

## Tech Stack
- **Backend:** FastAPI, Pydantic, MongoDB (motor), JWT, bcrypt
- **Frontend:** React, react-router-dom, react-beautiful-dnd, Tailwind CSS
- **Libraries:** qrcode.react, react-leaflet, leaflet, axios

## Key API Endpoints
- `POST /api/admin/login` — Admin login
- `GET /api/tours` — List all tours (auth required)
- `POST /api/tours` — Create tour
- `PUT /api/tours/{tour_id}` — Update tour
- `DELETE /api/tours/{tour_id}` — Delete tour
- `GET /api/public/tours/{tour_id}` — Public tour data for player
- `GET /api/share/{tour_id}` — OG meta tags + redirect for link previews

## Completed Refactoring
- **(DONE)** Stage 1: Player extracted from App.js into 6 modular files (1255 lines removed, zero behavior changes)

## Upcoming/Future Tasks
- **(P1)** Stage 2 Refactor: Extract Tour Editor from App.js
- **(P1)** Stage 3 Refactor: Extract Dashboard from App.js
- **(P1)** Backend Refactor: Split server.py into route modules
- **(P2)** CSS Refactor: Clean up App.css duplications
- **(P2)** Add "Change Password" UI in admin dashboard
- **(P2)** Drag-and-drop sidebar reordering
- **(P2)** Story Import (Markdown/DOCX upload -> auto-generate tour)
- **(P2)** Progressive Hints (reveal one by one with delay)
- **(P2)** Undo/Redo in editor
- **(P2)** Auto-save Recovery (localStorage)
- **(P2)** "Give Up & Skip" button in player
- **(P2)** Tour Analytics (completion rates, drop-off points)
- **(P3)** Monetization (Stripe)
- **(P3)** Collaboration (multi-admin)
- **(P3)** Version History (rollback)

## Database
- **Collection:** `tours` with nested `stops[]` and `pages[]`
- 17+ tours across preview and deployed databases
