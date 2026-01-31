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

### Player Features  
- Mobile-responsive tour player
- Welcome screen support
- Progressive unlock/verification system
- Hint support
- Navigation between stops and pages

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

### Player (Jan 29-31, 2026)
- ✅ Welcome screen with GPS info display
- ✅ Progress indicator (Stop X of Y, Page X of Y)
- ✅ Content rendering (text, media, audio)
- ✅ TEXT, MULTIPLE CHOICE, WHITEBOARD verification
- ✅ Case-insensitive answer matching
- ✅ Previous/Next navigation
- ✅ Hint full-page view

### Visual Themes
- ✅ Admin: Clean, neutral, high-contrast
- ✅ Player: "Boho Sunshine" warm theme

---

## Pending / Backlog

### P1 - High Priority
- [ ] Interactive Leaflet map for GPS selection (deferred by user)
- [ ] Photo upload verification (deferred - needs storage decision)

### P2 - Medium Priority
- [ ] GPS enforcement in player (geolocation check)
- [ ] Give Up & Skip option

### P3 - Nice to Have
- [ ] Export QR codes as printable images
- [ ] Multi-stop GPS routing visualization
- [ ] Tour analytics/completion tracking
- [ ] Social sharing features

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
- welcomeTitle, welcomeBody, welcomeImageUrl, welcomeAudioUrl
- welcomeGpsEnabled, welcomeGpsLat, welcomeGpsLng, welcomeGpsRadiusMeters
- stops: List[Stop]

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
