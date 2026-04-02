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
1. TEXT, 2. MULTIPLE CHOICE, 3. WHITEBOARD, 4. PHOTO, 5. RANKING, 6. TIMER, 7. CHECKLIST, 8. SHAKE, 9. CONTINUE

### Player Features
- Welcome screen, completion screen, inline unlock gates, themed dividers
- Hint system, progress tracking, localStorage saving (24h expiry)
- Custom correct/wrong messages, auto-advance

### Share Links with OG Meta Tags
- `/api/share/{tour_id}` serves HTML with Open Graph tags + auto-redirect

## Architecture
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py            # FastAPI (auth, CRUD, share endpoint) — 466 lines
└── frontend/
    ├── package.json
    └── src/
        ├── App.css           # All styles — 3961 lines
        ├── App.js            # Routing shell — 58 lines
        ├── index.css         # Tailwind setup
        └── components/
            ├── AuthPages.jsx          # Login/Setup/AuthPage
            ├── ToursList.jsx          # Dashboard
            ├── Icons.jsx              # Shared SVG icons
            ├── authContext.jsx         # AuthProvider, useAuth, authAxios
            ├── PlayerLayout.jsx        # Main player orchestrator
            ├── PlayerWelcome.jsx       # Welcome screen
            ├── PlayerCompletion.jsx    # Completion overlay + confetti
            ├── UnlockGate.jsx          # All unlock mode UIs
            ├── ContentRenderer.jsx     # Content rendering + embed helpers
            ├── usePlayerProgress.js    # localStorage progress hook
            └── editor/
                ├── TourEditor.jsx       # Main editor orchestrator
                ├── StopEditor.jsx       # Stop editing panel
                ├── PageEditor.jsx       # Page editing panel
                ├── WelcomeEditor.jsx    # Welcome/GPS/completion editor
                ├── ShareAssetsPanel.jsx # QR code + share links
                ├── ClearableInput.jsx   # Input with clear button
                ├── AccordionSection.jsx # Collapsible sections
                ├── DeleteConfirmModal.jsx # Delete confirmation modal
                └── GalleryUrlsEditor.jsx  # Gallery URL list editor
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
- **(DONE)** Stage 1: Player extracted from App.js into 6 modular files
- **(DONE)** Stage 2: Tour Editor extracted from App.js into 9 modular files
- **(DONE)** Stage 3: Dashboard (ToursList) and Auth pages extracted from App.js. App.js is now a 58-line routing shell.

## Upcoming/Future Tasks
- **(P1)** Backend Refactor: Split server.py into route modules
- **(P2)** CSS Refactor: Clean up App.css duplications
- **(P2)** Add "Change Password" UI in admin dashboard
- **(P2)** Drag-and-drop sidebar reordering
- **(P2)** Story Import (Markdown/DOCX upload -> auto-generate tour)
- **(P2)** Progressive Hints, Undo/Redo, Auto-save Recovery
- **(P2)** "Give Up & Skip" button in player
- **(P2)** Tour Analytics (completion rates, drop-off points)
- **(P3)** Monetization (Stripe), Collaboration, Version History

## Database
- **Collection:** `tours` with nested `stops[]` and `pages[]`
- 18+ tours across preview and deployed databases
