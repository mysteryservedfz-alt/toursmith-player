# Toursmith Admin - PRD

## Overview
Admin-only tool for managing walking tours with puzzle stops.

## GitHub
- Repo: `mysteryservedfz-alt/toursmith-admin`
- Branch: `main`

## Tech Stack
- Backend: FastAPI + MongoDB
- Frontend: React + Tailwind + shadcn/ui
- Auth: JWT (email/password)

## Core Requirements
- [x] Admin login (email/password with JWT)
- [x] Tours CRUD: name, city, difficulty, intro_story
- [x] Stops CRUD: title, guest_instructions, puzzle_text, answer_code, hints
- [x] Reorder stops via drag-and-drop (persisted)
- [x] Duplicate tour (copies all stops)
- [x] Autosave on blur (no save buttons)

## NOT Included (by design)
- Public pages
- Payments
- Calendar
- AI writing
- Design polish

## Implementation Date
- January 28, 2026

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/setup | Create first admin |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/tours | List all tours |
| POST | /api/tours | Create tour |
| GET | /api/tours/:id | Get tour |
| PATCH | /api/tours/:id | Update tour |
| DELETE | /api/tours/:id | Delete tour + stops |
| POST | /api/tours/:id/duplicate | Duplicate tour |
| GET | /api/tours/:id/stops | List stops |
| POST | /api/tours/:id/stops | Create stop |
| PATCH | /api/stops/:id | Update stop |
| DELETE | /api/stops/:id | Delete stop |
| POST | /api/tours/:id/stops/reorder | Reorder stops |

## Backlog / Future
- P1: Bulk import/export tours
- P2: Admin user management (multiple admins)
- P2: Tour preview mode
