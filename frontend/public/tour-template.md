# Toursmith Tour — JSON Template & AI Prompt

## 1. The template (fill in, then Import JSON on dashboard)

```json
{
  "title": "Your Tour Title",
  "description": "1–2 sentence tagline shown on dashboard card.",
  "status": "draft",
  "backgroundColor": "#ffffff",
  "logoUrl": "https://your-cdn.com/logo.png",
  "allowSkip": true,

  "welcomeTitle": "Hello there, love.",
  "welcomeBody": "Opening paragraph from your host. Sets tone, gives first instruction.",
  "welcomeImageUrl": "https://your-cdn.com/welcome.png",
  "welcomeAudioUrl": "https://your-cdn.com/welcome.mp3",
  "welcomeButtonLabel": "Begin the Alignment",
  "welcomeGpsEnabled": true,
  "welcomeGpsLat": 27.7340,
  "welcomeGpsLng": -82.7030,
  "welcomeGpsRadiusMeters": 100,

  "completionTitle": "You did it.",
  "completionBody": "Closing message — the big reveal, the moral, the 'you are the icon now.'",
  "completionImageUrl": "https://your-cdn.com/finale.png",
  "completionButtonLabel": "Tag @MysteryServed",
  "completionButtonUrl": "https://instagram.com/mysteryserved",

  "stops": [
    {
      "title": "Stop 1 — Tommy's Hideaway",
      "description": "Address + walking directions + what they should say to the server.",
      "order": 0,
      "unlockMode": "continue",
      "pages": [
        {
          "title": "The Gear",
          "content": "Main story/task text shown to player on this page.",
          "order": 0,
          "unlockMode": "continue"
        },
        {
          "title": "The Task",
          "content": "The puzzle prompt. Tell them what to look for.",
          "order": 1,
          "unlockMode": "text",
          "answer": "GOLDEN",
          "caseInsensitive": true,
          "hintText": "First letter of each Beatles song sketch on Page 1.",
          "autoShowHint": false,
          "wrongAnswerMessage": "Not quite. Look again.",
          "correctAnswerMessage": "There it is — well done."
        }
      ]
    }
  ]
}
```

---

## 2. Field cheat sheet

### Tour-level
| Field | What it does |
|---|---|
| `title` | Dashboard card + player header |
| `description` | Short tagline on the card |
| `status` | `"draft"` (hidden) or `"published"` (live) |
| `backgroundColor` | Hex color for pages (use `"#ffffff"` white, or `"#1a1a1a"` dark) |
| `skinImageUrl` | Full-page background image URL (optional) |
| `logoUrl` | Logo for print booklet |
| `allowSkip` | `true` = shows "Stuck? Skip" on puzzles. `false` = locked (pitch mode) |
| `welcomeTitle` / `welcomeBody` | Screen shown before tour starts |
| `welcomeImageUrl` / `welcomeAudioUrl` | Optional hero image + intro audio |
| `welcomeGpsEnabled` | `true` forces player to be at location to start |
| `welcomeGpsLat` / `welcomeGpsLng` | GPS coordinates (look up on Google Maps → right-click → Copy lat/lng) |
| `welcomeGpsRadiusMeters` | How close they must be. `100` = 100m bubble |
| `completion*` | Final screen shown after last stop |

### Stop-level
| Field | What it does |
|---|---|
| `title` | Stop name in sidebar + player header |
| `description` | Intro shown when they first land on this stop (navigation directions go here) |
| `order` | `0` for first stop, `1` for second, etc. |
| `pages` | List of pages within this stop |
| `unlockMode` | `"continue"` = no puzzle. See unlock modes below |

### Page-level
| Field | What it does |
|---|---|
| `title` | Page header |
| `content` | Main body text (your narrative) |
| `body2` | Optional second paragraph below content |
| `order` | `0` first, `1` second |
| `imageUrl` | Single image shown on page |
| `galleryUrls` | `["url1","url2",...]` for multi-image gallery |
| `audioUrl` | Audio player shown on page |
| `mediaType` + `mediaUrl` | `"youtube"` + youtube URL, `"video"` + mp4 URL |
| `ctaLabel` / `ctaUrl` | Button at bottom (e.g., "Visit website") |
| `unlockMode` | See below |

---

## 3. Unlock modes (how to gate a page)

| Mode | What player does | Required fields |
|---|---|---|
| `"continue"` | Just taps Continue | none |
| `"text"` | Types a password | `answer`, optionally `caseInsensitive` (default true) |
| `"multiple_choice"` | Picks from options | `mcOptions: ["A","B","C"]`, `mcCorrectIndex: 0` |
| `"whiteboard"` | Types any text (freeform) | none |
| `"photo"` | Uploads any photo | none |
| `"ranking"` | Drag items into correct order | `mcOptions: ["first","second","third"]` (order = correct order) |
| `"timer"` | Waits N seconds | `answer: "60"` (seconds) |
| `"checklist"` | Checks off every box | `mcOptions: ["box 1","box 2"]` |
| `"shake"` | Shakes phone | none |

---

## 4. Hints & custom messages

```json
{
  "hintText": "First letter of each Beatles song.",
  "autoShowHint": false,
  "wrongAnswerMessage": "Look at the sign again, love.",
  "correctAnswerMessage": "Nailed it."
}
```

- `hintText` — shown when player taps "Need a hint?"
- `autoShowHint: true` — displays hint automatically, no button needed
- `wrongAnswerMessage` — shows on wrong answer (falls back to generic if blank)
- `correctAnswerMessage` — brief congrats before moving on

---

## 5. AI Prompt — paste this into ChatGPT/Claude to generate a tour

```
You are writing a JSON tour file for a walking-tour player called Toursmith.
Use the schema I give you below exactly. Return ONE valid JSON object, nothing else.

CONTEXT:
- City / area: [PASTE]
- Tour theme / vibe: [PASTE — e.g., "artsy, rock and roll, 80-year-old aunt Celeste as host"]
- Target audience: [e.g., "couples on a date night, ~2 hours total"]
- Host character voice (optional): [e.g., "warm, punchy, Beatles fan"]
- Real stops (in walking order) — give me name, address, what they do there, any puzzle/password:
   1. [NAME, ADDRESS, what happens, password if any]
   2. [NAME, ADDRESS, ...]
   3. [NAME, ADDRESS, ...]
   4. [NAME, ADDRESS, ...]
   5. [NAME, ADDRESS, ...]
- Welcome GPS start point: [ADDRESS or "skip"]
- Finale message / big reveal: [PASTE or "surprise me"]

RULES:
- Every stop has at least one page
- Puzzle stops use unlockMode "text" with caseInsensitive true
- First page of each stop is usually unlockMode "continue" (the setup)
- Last page of each stop is the password gate (unlockMode "text")
- Always include a hintText for every password gate (gentle nudge, not the answer)
- Keep page "content" to 2–4 short paragraphs. Direct, in the host's voice. No fluff.
- Include welcomeTitle, welcomeBody, completionTitle, completionBody.
- Set status to "draft".
- Do NOT include "id", "createdAt", "updatedAt" fields — leave them out.
- Do NOT invent image/audio URLs — leave media fields out unless I give URLs.

SCHEMA (follow exactly):
[paste the template JSON from above here]

Now write the tour.
```

---

## 6. How to use this

1. Paste the AI prompt above into ChatGPT (or Claude)
2. Fill in the `[PASTE]` slots with your real info
3. Paste the template JSON into the schema section
4. AI returns a complete tour JSON
5. Save as `my-tour.json` on your computer
6. Dashboard → **Import JSON** → pick file → done
7. Open the imported tour, add your image/audio URLs manually, publish

Tip: copy an existing tour you like (Export JSON button), feed that to the AI as an example, and ask it to write one in the same style. Works great.
