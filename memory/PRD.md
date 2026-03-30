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

### Share Links with OG Meta Tags
- `/api/share/{tour_id}` serves HTML with Open Graph tags
- Link previews show tour name and description in iMessage, Slack, Instagram, etc.
- Auto-redirects to player

## Tours Created
1. **Billy Strings — St. Augustine** (12 stops, enhanced with all verification types)
2. **Fuji's Tour with the Billygoats** (10 stops, 7 verification types)
3. Plus 15 previously existing tours (synced across preview and deployed)

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
        ├── App.js            # Monolithic React app
        └── index.css         # Tailwind setup
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

## Upcoming/Future Tasks
- **(P0)** Add "Change Password" UI in admin dashboard
- **(P1)** Drag-and-drop sidebar reordering
- **(P1)** Story Import (Markdown/DOCX upload → auto-generate tour)
- **(P1)** Progressive Hints (reveal one by one with delay)
- **(P1)** Undo/Redo in editor
- **(P1)** Auto-save Recovery (localStorage)
- **(P1)** "Give Up & Skip" button in player
- **(P1)** Tour Analytics (completion rates, drop-off points)
- **(P2)** Monetization (Stripe)
- **(P2)** Collaboration (multi-admin)
- **(P2)** Version History (rollback)

## Refactoring Needed
- Break App.js monolith into components (Player, TourEditor, Sidebar, etc.)
- Move backend routes into separate modules

## Database
- **Collection:** `tours` with nested `stops[]` and `pages[]`
- Preview and deployed databases synced with 17+ tours
- Tour creation scripts: `create_billy_strings_v2.py`, `create_fujis_tour.py`
