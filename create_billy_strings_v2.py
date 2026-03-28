#!/usr/bin/env python3
"""Update Billy Strings tour with enhanced features and new content."""

import requests
import uuid
import json

# Push to BOTH preview and deployed
PREVIEW = "https://story-challenge-hub.preview.emergentagent.com"
DEPLOYED = "https://toursmith-admin.emergent.host"

def page(title, content, order, unlock_mode="continue", answer=None, hint=None, task=None, mc_options=None):
    p = {
        "id": str(uuid.uuid4()),
        "title": title,
        "content": content,
        "order": order,
        "unlockMode": unlock_mode,
        "caseInsensitive": True,
        "storyMode": unlock_mode == "continue",
    }
    if answer:
        p["answer"] = answer
    if hint:
        p["hintText"] = hint
    if task:
        p["taskInstructions"] = task
    if mc_options:
        p["mcOptions"] = mc_options
    return p


# ═══════════════════════════════════════════════════════════
# STOP 1A — MURAL (115 Anastasia Blvd / Sarbez)
# ═══════════════════════════════════════════════════════════
stop1a_pages = [
    page(
        title="",
        content="""Go to this location. Start here. You will see a large abstract mural on the wall. Before you move on — a question. Everybody knows him as Billy Strings. But who actually gave him that name?

A — His stepdad Terry
B — A bar owner in Michigan
C — His Aunt Mondi
D — He made it up himself

Enter the letter of the correct answer to continue.""",
        order=0,
        unlock_mode="text",
        answer="C",
    ),
    page(
        title="",
        content="good... you are in it now",
        order=1,
    ),
]

stop1a = {
    "id": str(uuid.uuid4()),
    "title": "MURAL — 115 Anastasia Blvd (Sarbez)",
    "description": "115 Anastasia Blvd, St. Augustine FL",
    "order": 0,
    "unlockMode": "continue",
    "pages": stop1a_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 1B — MURAL (104 Anastasia Blvd)
# ═══════════════════════════════════════════════════════════
stop1b_pages = [
    page(
        title="",
        content="""Walk to this mural. You have probably noticed the 33 everywhere in Billy's world. On his guitar. Tattooed on his right forearm. On merch. Everywhere. What does the number 33 mean to Billy Strings?

A — It's his lucky number he picked randomly
B — It was his grandfather's race car number
C — It's the number of his first hometown bar
D — It's a Grateful Dead reference

Enter the letter of the correct answer to continue.""",
        order=0,
        unlock_mode="text",
        answer="B",
    ),
]

stop1b = {
    "id": str(uuid.uuid4()),
    "title": "MURAL — 104 Anastasia Blvd",
    "description": "104 Anastasia Blvd, St. Augustine FL",
    "order": 1,
    "unlockMode": "continue",
    "pages": stop1b_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 1C — MURAL (9 Anastasia Blvd)
# ═══════════════════════════════════════════════════════════
stop1c_pages = [
    page(
        title="",
        content="""Keep going. What is Billy Strings' most famous song?

A — Red Daisy
B — Pyramid Country
C — Running
D — Dust in a Baggie

Enter the letter of the correct answer to continue.""",
        order=0,
        unlock_mode="text",
        answer="D",
    ),
]

stop1c = {
    "id": str(uuid.uuid4()),
    "title": "MURAL — 9 Anastasia Blvd",
    "description": "9 Anastasia Blvd, St. Augustine FL",
    "order": 2,
    "unlockMode": "continue",
    "pages": stop1c_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 1D — MURAL + INSTAGRAM PHOTO
# ═══════════════════════════════════════════════════════════
stop1d_pages = [
    page(
        title="",
        content="""One more. Billy won his first Grammy for Best Bluegrass Album. What was the album called?

A — Renewal
B — Turmoil and Tinfoil
C — Home
D — Me/And/Dad

Enter the letter of the correct answer to continue.""",
        order=0,
        unlock_mode="text",
        answer="C",
    ),
    page(
        title="",
        content="""Get your crew together in front of this mural.

This is the shot.

Take a photo. Post it. Tag @mysteryserved on Instagram.

Upload your photo below to continue.""",
        order=1,
        unlock_mode="photo",
    ),
]

stop1d = {
    "id": str(uuid.uuid4()),
    "title": "MURAL — 200/303 Anastasia Blvd",
    "description": "200 or 303 Anastasia Blvd, St. Augustine FL",
    "order": 3,
    "unlockMode": "continue",
    "pages": stop1d_pages,
}

# ═══════════════════════════════════════════════════════════
# TRANSITION — THE BRIDGE (TIMER)
# ═══════════════════════════════════════════════════════════
bridge_pages = [
    page(
        title="",
        content="""head toward the water
cross the bridge
something changes when you cross water

take your time
this is not a race""",
        order=0,
        unlock_mode="timer",
        answer="45",
    ),
]

bridge = {
    "id": str(uuid.uuid4()),
    "title": "THE BRIDGE",
    "description": "",
    "order": 4,
    "unlockMode": "continue",
    "pages": bridge_pages,
}

# ═══════════════════════════════════════════════════════════
# NEW: DEEP CUTS — RANKING (Timeline)
# ═══════════════════════════════════════════════════════════
deepcuts_pages = [
    page(
        title="",
        content="""You crossed the water. Now it gets harder.

Billy's life reads like a novel — bluegrass picking parties, teenage metal bands, Grammy stages, and a wedding at a music festival.

Put these milestones in the right order. Drag them. Top to bottom. First to last.""",
        order=0,
    ),
    page(
        title="",
        content="Drag these into the correct order — earliest to most recent.",
        order=1,
        unlock_mode="ranking",
        mc_options=[
            "Born during a bluegrass picking party in Lansing",
            "Played in metal band Groove Tongue",
            "First paying gig with Don Julin",
            "Won first Grammy for Best Bluegrass Album",
            "Married Ally Dale at Hoxeyville Michigan",
            "Released Highway Prayers",
        ],
    ),
]

deepcuts = {
    "id": str(uuid.uuid4()),
    "title": "DEEP CUTS",
    "description": "",
    "order": 5,
    "unlockMode": "continue",
    "pages": deepcuts_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 2 — CASTILLO + BONUS HARD TRIVIA
# ═══════════════════════════════════════════════════════════
stop2_pages = [
    page(
        title="",
        content="""Go to the fort. Stay outside near the water. Terry Barber is the man who taught Billy Strings to play guitar. What is Terry to Billy?

A — His biological father
B — His uncle on his mother's side
C — His stepfather
D — His first band manager

Enter the letter of the correct answer to continue.""",
        order=0,
        unlock_mode="text",
        answer="C",
    ),
    page(
        title="",
        content="""Bonus round. This one separates the real ones.

Billy was born during what event?

A — A Fourth of July bonfire
B — A bluegrass picking party
C — A church service
D — A county fair

Enter the letter of the correct answer to continue.""",
        order=1,
        unlock_mode="text",
        answer="B",
        hint="His family was making music when he arrived.",
    ),
]

stop2 = {
    "id": str(uuid.uuid4()),
    "title": "CASTILLO",
    "description": "1 S Castillo Dr, St. Augustine FL",
    "order": 6,
    "unlockMode": "continue",
    "pages": stop2_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 3 — PLAZA + INTERVIEW TRIVIA
# ═══════════════════════════════════════════════════════════
stop3_pages = [
    page(
        title="",
        content="""Go to the plaza. This is the oldest city in the country. People have been standing in this spot for centuries. Before she was known as Billy's wife, Ally Dale had a specific job working with his band. What was it?

A — Sound engineer
B — Social media manager
C — Tour manager
D — Booking agent

Enter the letter of the correct answer to continue.""",
        order=0,
        unlock_mode="text",
        answer="C",
    ),
    page(
        title="",
        content="""One more from the plaza. This one is from an actual interview.

What does Billy say to himself right before walking on stage?

A — Stay humble, play hard
B — I ain't afraid of you people
C — For Terry, every night
D — Just breathe, just play

Enter the letter of the correct answer to continue.""",
        order=1,
        unlock_mode="text",
        answer="B",
        hint="It is not a prayer. It is a dare.",
    ),
]

stop3 = {
    "id": str(uuid.uuid4()),
    "title": "PLAZA",
    "description": "Plaza de la Constitucion, St. Augustine FL",
    "order": 7,
    "unlockMode": "continue",
    "pages": stop3_pages,
}

# ═══════════════════════════════════════════════════════════
# NEW: SHAKE STOP — Transition
# ═══════════════════════════════════════════════════════════
shake_pages = [
    page(
        title="",
        content="""you are almost there

one more stop

shake it off and keep moving""",
        order=0,
        unlock_mode="shake",
    ),
]

shake_stop = {
    "id": str(uuid.uuid4()),
    "title": "SHAKE IT OFF",
    "description": "",
    "order": 8,
    "unlockMode": "continue",
    "pages": shake_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 4 — AVILES STREET + WILD INTERVIEW Q
# ═══════════════════════════════════════════════════════════
stop4_pages = [
    page(
        title="",
        content="""Go to Aviles Street. Oldest street in the country. You have come a long way from those murals. Billy Strings was born in Lansing Michigan and grew up all over the state. Where does he live now?

A — Asheville NC
B — Nashville TN
C — Marquette MI
D — Austin TX

Enter the letter of the correct answer to continue.""",
        order=0,
        unlock_mode="text",
        answer="B",
    ),
    page(
        title="",
        content="""Last hard one. You either read the interviews or you didn't.

What did Billy listen to backstage to get hyped before shows?

A — Old Ralph Stanley recordings
B — Memphis trap music — specifically Young Dolph
C — Early Metallica albums
D — Bill Monroe live bootlegs

Enter the letter of the correct answer to continue.""",
        order=1,
        unlock_mode="text",
        answer="B",
        hint="Not what you would expect from a bluegrass player.",
    ),
]

stop4 = {
    "id": str(uuid.uuid4()),
    "title": "AVILES STREET",
    "description": "Aviles Street, St. Augustine FL",
    "order": 9,
    "unlockMode": "continue",
    "pages": stop4_pages,
}

# ═══════════════════════════════════════════════════════════
# NEW: FINAL CHECKLIST — Before You Go
# ═══════════════════════════════════════════════════════════
checklist_pages = [
    page(
        title="",
        content="Before you leave. Check off each one.",
        order=0,
        unlock_mode="checklist",
        mc_options=[
            "Posted a photo and tagged @mysteryserved on Instagram",
            "Tried food at one of the stops",
            "Learned something about Billy you did not know before",
            "Had a moment where you stopped and just looked around",
        ],
    ),
]

checklist_stop = {
    "id": str(uuid.uuid4()),
    "title": "BEFORE YOU GO",
    "description": "",
    "order": 10,
    "unlockMode": "continue",
    "pages": checklist_pages,
}

# ═══════════════════════════════════════════════════════════
# FINAL — Closing
# ═══════════════════════════════════════════════════════════
final_pages = [
    page(
        title="",
        content="take it with you",
        order=0,
    ),
]

final_stop = {
    "id": str(uuid.uuid4()),
    "title": "FINAL",
    "description": "",
    "order": 11,
    "unlockMode": "continue",
    "storyMode": True,
    "pages": final_pages,
}

# ═══════════════════════════════════════════════════════════
# ASSEMBLE TOUR
# ═══════════════════════════════════════════════════════════
all_stops = [stop1a, stop1b, stop1c, stop1d, bridge, deepcuts, stop2, stop3, shake_stop, stop4, checklist_stop, final_stop]

tour_update = {
    "title": "Billy Strings — St. Augustine",
    "description": "Mystery Served — Billy Strings Weekend — St. Augustine",
    "status": "published",
    "backgroundColor": "#ffffff",
    "welcomeTitle": "Mystery Served",
    "welcomeBody": "Hey Billygoats — what's up? Welcome to St. Augustine. You made it. Now don't just stand around between shows. There are a few spots in this town worth finding. Some things hiding in plain sight. A few questions only real fans know the answer to. Run this with your crew. Pay attention. Go to each location listed. Follow the instructions. Enter your answers to continue.",
    "welcomeButtonLabel": "START — LETS GO",
    "completionTitle": "SHAKEDOWN",
    "completionBody": "you will hear it before you see it\nyou made it through\nnow go find your people\nfind Mystery Served at Shakedown",
    "stops": all_stops,
}

# ═══════════════════════════════════════════════════════════
# PUSH TO BOTH DATABASES
# ═══════════════════════════════════════════════════════════
for env_name, base_url in [("PREVIEW", PREVIEW), ("DEPLOYED", DEPLOYED)]:
    print(f"\n{'='*50}")
    print(f"Pushing to {env_name}: {base_url}")
    print(f"{'='*50}")
    
    # Login
    login = requests.post(f"{base_url}/api/admin/login", json={"username": "demo", "password": "demo123"})
    if login.status_code != 200:
        print(f"  Login failed: {login.text}")
        continue
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Find existing Billy Strings tour
    tours = requests.get(f"{base_url}/api/tours", headers=headers).json()
    billy_tour = None
    for t in tours:
        if "Billy Strings" in t.get("title", ""):
            billy_tour = t
            break
    
    if billy_tour:
        tour_id = billy_tour["id"]
        print(f"  Found existing tour: {tour_id}")
        resp = requests.put(f"{base_url}/api/tours/{tour_id}", json=tour_update, headers=headers)
        print(f"  Update status: {resp.status_code}")
    else:
        create = requests.post(f"{base_url}/api/tours", json={"title": "Billy Strings — St. Augustine", "description": "Mystery Served"}, headers=headers)
        tour_id = create.json()["id"]
        print(f"  Created new tour: {tour_id}")
        resp = requests.put(f"{base_url}/api/tours/{tour_id}", json=tour_update, headers=headers)
        print(f"  Update status: {resp.status_code}")
    
    if resp.status_code == 200:
        result = resp.json()
        print(f"  Title: {result['title']}")
        print(f"  Stops: {len(result['stops'])}")
        for s in result['stops']:
            pages = s.get('pages', [])
            modes = [p['unlockMode'] for p in pages if p.get('unlockMode') != 'continue']
            print(f"    {s['order']:2d}. {s['title']:<40} {len(pages)} pages  {', '.join(modes) if modes else 'story'}")
        print(f"  Player: {base_url}/play/{tour_id}")
