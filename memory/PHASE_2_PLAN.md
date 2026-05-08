# Toursmith — Future Build Plan (Phase 2+)

## Phase 2 — Stats & Bookings Manager (next major build)

Triggered by: Grace flagging that the inline guest-link list under each tour card becomes unmanageable past 3 bookings.

### A. Dedicated "Bookings" page (separate from Tours dashboard)
- New top-nav link: **Bookings** (or "Guest Links" / "CRM")
- Full-page table view, NOT inline cards
- Columns: Tour | Guest Label | Contact | Notes | Created | Expires | Status | Devices | Progress | Actions
- Filterable: by tour, by status (active/expired/completed), by date range
- Sortable: any column
- Search bar (search guest label, contact, notes)
- Bulk actions: select multiple → disable / delete / export CSV of selection
- Pagination once > 50 rows

### B. Tour cards keep ONLY a summary
- Tour card shows: "📊 12 bookings • 8 active • 4 completed"
- Click → jumps to filtered Bookings page for that tour
- No more cluttered inline list under each card

### C. Stats per guest link (Phase A from earlier conversation)
Track per `/g/<shortCode>` link:
- Open count (every load = +1)
- Unique device count (catches link-sharing freeloaders — Grace's #1 use case)
- First open timestamp
- Last activity timestamp
- Stops reached (max stop index they hit)
- Pages reached
- Skip-button presses (per stop)
- Hint-button presses (per stop)
- Wrong-answer attempts (per puzzle)
- Completed? (Y/N + completion timestamp)
- Total tour duration (first open → completion)
- Time per stop (average of stop_landed → next_stop_landed)

### D. Per-guest stats modal
- Click "📊 Stats" on a booking row → modal pops with all of C
- Visual progress bar (Stop 1 ✅ Stop 2 ✅ Stop 3 ⏳ Stop 4 ⬜ ...)
- Time per stop bar chart
- Device count alert if devices > expected (e.g., booked for 4, opened on 6 = ⚠️ flag)

### E. Per-tour aggregate stats panel
On the tour editor page, add a "Stats" tab:
- Total bookings sent (all-time / last 30d / last 7d)
- Open rate (% of bookings that loaded the link at all)
- Completion rate (% finished)
- Average tour duration
- Hardest puzzle (most skip + hint presses + wrong answers)
- Drop-off stop (where most groups quit)
- Average device count (catches systemic over-sharing)

### F. Pitch / investor view
- Aggregate stats across ALL tours
- "92% completion rate, avg 1h 53min, 40% repeat-open rate"
- Exportable as PDF or screenshot for marketing

---

## Build order (when Grace says go)

1. **Stats logging** — backend events table + endpoints (silent, ~1-2 hours)
2. **Per-guest stats modal** — quick win, low risk (~1 hour)
3. **Dedicated Bookings page** — replaces inline guest-link cards (~3-4 hours)
4. **Per-tour aggregate panel** — Tour editor → Stats tab (~2 hours)
5. **Filters / search / bulk actions on Bookings page** (~2 hours)
6. **Pitch view + exports** — only if Grace asks for it (~2 hours)

Total Phase 2 estimate: ~10-12 hours of careful work, ship in 2-3 deploys.

---

## Stability rules (Grace's constraints)

- DO NOT touch existing tours or tour data
- Logging is passive — never blocks the player
- New dashboard features additive, not replacement (until proven solid)
- Keep current Copy Link, Disable, Delete, Trash buttons working same way
- Each phase deploys independently — never bundle untested chunks
- Test on preview, redeploy only after Grace verifies
