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
- **Print Booklet** — generate professional B&W printable booklets from any tour

### Print Booklet Feature
- Accessed via "Print" button in tour editor header (opens in new tab)
- Route: `/admin/tour/:tourId/print` (protected)
- 2 cards per US Letter page, cut in half, flip-book style
- Cover card: tour title, description, stop count, instructions
- Stop cards: stop number, title, content, clue box, scratch-off circle (for gated stops)
- Completion card: congratulations message
- Scratch-off circles appear only on stops with text or multiple_choice gates
- Professional typography (serif body, sans-serif headings)
- Black & white, printer-friendly

### 9 Verification/Unlock Types
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
│   └── server.py            # FastAPI (auth, CRUD, share) — 466 lines
└── frontend/
    ├── package.json
    └── src/
        ├── App.css           # All styles
        ├── App.js            # Routing shell — 60 lines
        ├── index.css         # Tailwind setup
        └── components/
            ├── AuthPages.jsx          # Login/Setup/AuthPage
            ├── ToursList.jsx          # Dashboard
            ├── PrintBooklet.jsx       # Print booklet generator
            ├── Icons.jsx              # Shared SVG icons
            ├── authContext.jsx         # AuthProvider, useAuth, authAxios
            ├── PlayerLayout.jsx        # Main player orchestrator
            ├── PlayerWelcome.jsx       # Welcome screen
            ├── PlayerCompletion.jsx    # Completion overlay
            ├── UnlockGate.jsx          # All unlock mode UIs
            ├── ContentRenderer.jsx     # Content rendering
            ├── usePlayerProgress.js    # localStorage progress hook
            └── editor/
                ├── TourEditor.jsx       # Editor orchestrator
                ├── StopEditor.jsx       # Stop editing panel
                ├── PageEditor.jsx       # Page editing panel
                ├── WelcomeEditor.jsx    # Welcome/GPS editor
                ├── ShareAssetsPanel.jsx # QR code + share links
                ├── ClearableInput.jsx, AccordionSection.jsx, DeleteConfirmModal.jsx, GalleryUrlsEditor.jsx
```

## Tech Stack
- **Backend:** FastAPI, Pydantic, MongoDB (motor), JWT, bcrypt
- **Frontend:** React, react-router-dom, react-beautiful-dnd, Tailwind CSS
- **Libraries:** qrcode.react, react-leaflet, leaflet, axios

## Key API Endpoints
- `POST /api/admin/login`, `GET /api/tours`, `POST /api/tours`, `PUT /api/tours/{tour_id}`, `DELETE /api/tours/{tour_id}`
- `GET /api/public/tours/{tour_id}`, `GET /api/share/{tour_id}`

## Completed
- Stage 1-3 Frontend Refactor: App.js reduced from 2944 → 60 lines
- Print Booklet feature: professional printable booklets from tour data

## Future Tasks
- **(P1)** Backend Refactor: Split server.py (when needed)
- **(P2)** CSS Refactor, Change Password UI, Drag-and-drop sidebar
- **(P2)** Story Import, Progressive Hints, Undo/Redo, Auto-save Recovery
- **(P2)** "Give Up & Skip" button, Tour Analytics
- **(P3)** Monetization (Stripe), Collaboration, Version History

## Database
- **Collection:** `tours` with nested `stops[]` and `pages[]`
- 18+ tours
