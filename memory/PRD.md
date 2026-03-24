# Toursmith - Product Requirements Document

## Original Problem Statement
Build a tour generator application for creating interactive, location-based experiences. Tours consist of stops and pages with various content types, verification methods, and customization options. The application should support both admin tour creation and public player experiences.

## User Personas
1. **Tour Creators** - Admin users who build and manage tours
2. **Tour Players** - Public users who experience tours on mobile devices

## Core Requirements

### Admin Features
- First-run admin setup with JWT authentication
- CRUD operations for Tours, Stops, and Pages
- Drag-and-drop reordering
- Rich content editing (text, media, embeds, audio)
- Multiple verification types
- QR code generation for sharing
- GPS location setup with interactive map
- **Skin System** - Background images for tours and pages

### Player Features  
- Mobile-responsive tour player
- Welcome screen support
- Progressive unlock/verification system
- Hint support
- Navigation between stops and pages
- GPS location lock enforcement
- **Inline unlock gate** — page content shown above answer input
- **Skin backgrounds** - Visual customization via background images

---

## Implemented Features

### Mystery Served Tour Creation (Mar 24, 2026)
- Created "The Recipe Conspiracy" tour — 5 stops, 21 pages
- Stops: Hawkers Asian Street Food (6p), Bodega on Central (4p), Kalamazoo Olive Co (4p), Poppo's Taqueria (4p), Plant Love Ice Cream (3p)
- Answer codes: ABRA → GOLD → TBD → HOCUS → POCUS → CADABRA
- Hints configured for puzzle pages (Hint 1 only)
- Welcome screen with Mystery Served branding
- Completion screen with "Thank you for playing" message
- Tour ID: 3e5dce21-2438-4451-9ee9-7049c0491530

### Inline Unlock Gate (Mar 24, 2026)
- Restructured player unlock gate to show page content above the answer input
- Players can read story/clue text and enter answers on the same screen
- Replaced the old "This content is locked" overlay modal
- Styled with clean divider and inline form below content
- Header with progress bar visible during puzzle pages
- Previous button available during puzzles

### Skin System (Feb 2, 2026)
- Tour-level default skin (`skinImageUrl`)
- Page-level skin override (`skinImageUrl` per page)
- URL-based image input in editor
- Preview thumbnail in editor
- Applied to all player screens (welcome, content, unlock, hints)
- Priority: Page skin → Tour skin → Background color

### Authentication & Admin (Jan 29, 2026)
- First-run admin setup
- JWT-based login
- Protected admin routes
- Change credentials endpoint (/api/admin/change-credentials)

### Tour Management (Jan 29, 2026)
- Create, Edit, Duplicate, Delete tours
- Tour listing with status badges
- Publish/Draft status toggle

### Stop & Page Editor (Jan 29-31, 2026)
- Accordion-based editor layout
- Title, Subtitle, Story Text fields
- On-Site Task / Instructions field
- Media Type selector (IMAGE/VIDEO/YOUTUBE)
- Background Image / Gallery support
- Embed support (YouTube, Vimeo, Google Maps)
- Audio URL with preview player
- CTA Button (label + URL)
- Drag-and-drop reordering
- Text color picker per stop/page

### Verification System (Jan 31, 2026)
- Story Mode toggle (bypass verification)
- TEXT verification with case-insensitive option
- MULTIPLE CHOICE verification
- WHITEBOARD verification
- Page-level override of stop settings

### Hints System (Jan 31, 2026)
- Hint text field per stop/page
- Auto-Show Hints toggle
- Full-page hint view with back button

### GPS Lock Feature (Jan 31, 2026)
- Interactive Leaflet map in admin editor
- Click-to-set coordinates on map
- "Use My Location" button
- Configurable radius (10-5000m)
- GPS enforcement in player (welcome screen)
- Distance calculation (Haversine formula)

### Player (Jan 29-31, 2026)
- Welcome screen with GPS lock enforcement
- Mystery Served brand logo on welcome screen
- Progress bar with completion percentage
- Content rendering (text, media, audio)
- Confetti celebration on tour completion
- Tour Complete screen
- Previous/Next navigation
- Custom success/error/transition messages

---

## Pending / Backlog

### P0 - Critical
- [ ] **Change Password UI** — Backend endpoint exists but no admin UI form

### P1 - High Priority
- [ ] Drag-and-drop sidebar reordering for pages
- [ ] Story Import Feature (Markdown/DOCX upload)
- [ ] Progressive Hints (3 hints revealed one by one)
- [ ] Undo/Redo functionality
- [ ] Auto-save Recovery (localStorage backup)
- [ ] "Give Up & Skip" option in player
- [ ] Tour Analytics (completion rates, drop-off points)

### P2 - Medium Priority
- [ ] Monetization (Stripe integration)
- [ ] Collaboration (multi-admin editing)
- [ ] Version History (rollback)

---

## Technical Architecture

### Backend
- FastAPI + Pydantic
- MongoDB (motor - async)
- JWT authentication

### Frontend  
- React 19
- TailwindCSS + Custom CSS variables
- react-beautiful-dnd for drag-drop
- qrcode.react for QR generation
- leaflet + react-leaflet for GPS maps

### File Structure
```
/app/
├── backend/
│   ├── server.py       # All routes, models, DB logic
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.js      # All components
        ├── App.css     # Component styles
        └── index.css   # Global styles, themes
```

---

## API Endpoints

### Authentication
- POST /api/admin/login
- GET /api/admin/exists
- POST /api/admin/setup
- POST /api/admin/change-credentials

### Tours (Protected)
- GET /api/tours
- POST /api/tours
- GET /api/tours/{id}
- PUT /api/tours/{id}
- DELETE /api/tours/{id}
- POST /api/tours/{id}/duplicate

### Public
- GET /api/public/tours/{id}

---

## Test Credentials
- Username: demo
- Password: demo123

## Key Tours
- Mystery Served (The Recipe Conspiracy): `3e5dce21-2438-4451-9ee9-7049c0491530`

---

## Known Issues / Limitations
1. Frontend is monolithic single-file (App.js) — fragile, needs refactoring
2. GPS feature requires HTTPS in production for geolocation API
3. Stop 2 (Bodega) answer is TBD — needs updating when UV reveal word is confirmed
