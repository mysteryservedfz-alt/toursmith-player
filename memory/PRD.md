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

### Player Features  
- Mobile-responsive tour player
- Welcome screen support
- Progressive unlock/verification system
- Hint support
- Navigation between stops and pages
- GPS location lock enforcement

---

## Implemented Features

### Authentication & Admin (Jan 29, 2026)
- ✅ First-run admin setup
- ✅ JWT-based login (demo/demo123)
- ✅ Protected admin routes

### Tour Management (Jan 29, 2026)
- ✅ Create, Edit, Duplicate, Delete tours
- ✅ Tour listing with status badges
- ✅ Publish/Draft status toggle

### Stop & Page Editor (Jan 29-31, 2026)
- ✅ Accordion-based editor layout
- ✅ Title, Subtitle, Story Text fields
- ✅ On-Site Task / Instructions field
- ✅ Media Type selector (IMAGE/VIDEO/YOUTUBE)
- ✅ Background Image / Gallery support
- ✅ Embed support (YouTube, Vimeo, Google Maps)
- ✅ Audio URL with preview player
- ✅ CTA Button (label + URL)
- ✅ Drag-and-drop reordering
- ✅ **Accordion Clear Buttons** - Trash icon to clear section content
- ✅ **Improved Save Button** - Purple gradient with save icon, turns green when unsaved
- ✅ **Keyboard Shortcuts** - Cmd/Ctrl+S (save), Cmd/Ctrl+N (new stop), Escape (back)
- ✅ **Duplicate Stop/Page** - Copy button in menu to duplicate content

### Verification System (Jan 31, 2026)
- ✅ Story Mode toggle (bypass verification)
- ✅ TEXT verification with case-insensitive option
- ✅ MULTIPLE CHOICE verification (add/remove options, select correct)
- ✅ WHITEBOARD verification (any input accepted)
- ✅ Page-level override of stop settings

### Hints System (Jan 31, 2026)
- ✅ Hint text field per stop/page
- ✅ Auto-Show Hints toggle
- ✅ Full-page hint view with back button

### Sharing Features (Jan 31, 2026)
- ✅ QR Code generation panel
- ✅ Copy Tour Link button
- ✅ Preview as Player button
- ✅ Player URL display

### GPS Lock Feature (Jan 31, 2026)
- ✅ Interactive Leaflet map in admin editor
- ✅ Click-to-set coordinates on map
- ✅ "Use My Location" button (browser geolocation)
- ✅ Manual lat/lng coordinate entry
- ✅ Configurable radius (10-5000m) - "bubble size"
- ✅ Visual radius circle on map
- ✅ GPS enforcement in player (strict mode)
- ✅ "Check My Location" button in player
- ✅ Distance calculation (Haversine formula)
- ✅ Location status states (checking, success, too far, error)
- ✅ Start Tour button disabled until GPS verified

### Player (Jan 29-31, 2026)
- ✅ Welcome screen with GPS lock enforcement
- ✅ **Mystery Served brand logo** on welcome screen
- ✅ **Progress bar** - Visual purple gradient at top
- ✅ **Progress percentage** - Shows completion %
- ✅ Progress indicator (Stop X of Y, Page X of Y)
- ✅ **Confetti celebration** on tour completion
- ✅ **Tour Complete screen** with congratulations message
- ✅ Content rendering (text, media, audio)
- ✅ TEXT, MULTIPLE CHOICE, WHITEBOARD verification
- ✅ Case-insensitive answer matching
- ✅ Previous/Next navigation
- ✅ Hint full-page view

### Visual Themes
- ✅ Admin: Clean, neutral, high-contrast
- ✅ Player: "Boho Sunshine" warm theme (default)
- ✅ **Player: "Noir Paws" Dark Theme (Feb 2, 2026)**
  - Dark navy gradient background (#0f172a → #1e293b)
  - Typography: Fraunces (headings), Manrope (body), Special Elite (labels)
  - Amber/gold accent color (#f59e0b) for CTAs and highlights
  - Glassmorphism effects with backdrop blur
  - Grain texture overlay for depth
  - Styled unlock gates (text input, multiple choice)
  - Themed completion screen with animation
  - GPS check section styling
  - Hint page dark theme

---

## Pending / Backlog

### P0 - Critical Bugs (User Reported)
- [ ] Fix "Not Found" for newly published tours (race condition)
- [ ] Fix stops without pages crashing player
- [ ] Fix image/media deletion not persisting after save

### P1 - High Priority (Next Up)
- [ ] **Move "Add Page" button** - from bottom of editor to sidebar header
- [ ] Auto-save Recovery (localStorage backup)
- [ ] Undo/Redo functionality

### P2 - Medium Priority
- [ ] Give Up & Skip option
- [ ] Timer/Countdown challenges
- [ ] Bulk Actions (select multiple stops/pages)

### P3 - Wish List (Future)
- [ ] Offline Mode (cache tour data)
- [ ] Drawing/Sketch Answer
- [ ] Voice Recording answers
- [ ] AR Integration
- [ ] Background Music per stop
- [ ] Preview Mode (test as player)
- [ ] Version History
- [ ] Import/Export tours
- [ ] Paid Tours (Stripe)
- [ ] Tour Marketplace
- [ ] Branded Player (custom colors/logo per tour)
- [ ] Embed Widget
- [ ] Social Sharing
- [ ] Collaboration (multiple admins)
- [ ] Tour Analytics

---

## Technical Architecture

### Backend
- FastAPI + Pydantic
- MongoDB (pymongo)
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

## Data Models

### Tour
- id, title, description, status
- welcomeTitle, welcomeBody, welcomeImageUrl, welcomeAudioUrl, welcomeButtonLabel
- welcomeGpsEnabled, welcomeGpsLat, welcomeGpsLng, welcomeGpsRadiusMeters
- stops: List[Stop]
- createdAt, updatedAt

### Stop
- id, title, subtitle, description, intro2
- taskInstructions, mediaType, mediaUrl
- imageUrl, imageAlt, galleryUrls
- embedUrl, embedCaption, audioUrl
- ctaLabel, ctaUrl
- unlockMode, answer, caseInsensitive
- mcOptions, mcCorrectIndex
- hintText, autoShowHint, storyMode
- pages: List[Page]
- order

### Page
- Same fields as Stop (excluding pages array)

---

## API Endpoints

### Authentication
- POST /api/admin/login
- GET /api/admin/exists
- POST /api/admin/setup

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

---

## Known Issues / Limitations
1. Page transitions removed due to React 19 + react-transition-group incompatibility
2. Frontend is monolithic single-file (App.js) - user requested no refactoring
3. GPS feature requires HTTPS in production for geolocation API to work
