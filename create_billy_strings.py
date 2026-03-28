#!/usr/bin/env python3
"""Create the Mystery Served - Billy Strings - St. Augustine tour via API."""

import requests
import uuid
import os

API_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://story-challenge-hub.preview.emergentagent.com")
API = f"{API_URL}/api"

# Login
login_resp = requests.post(f"{API}/admin/login", json={"username": "demo", "password": "demo123"})
assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
token = login_resp.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Create tour
create_resp = requests.post(f"{API}/tours", json={
    "title": "Billy Strings — St. Augustine",
    "description": "Mystery Served — Billy Strings Weekend — St. Augustine"
}, headers=headers)
assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
tour = create_resp.json()
tour_id = tour["id"]
print(f"Created tour: {tour_id}")


def page(title, content, order, unlock_mode="continue", answer=None, hint=None, task=None):
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

Enter the password to continue.""",
        order=0,
        unlock_mode="text",
        answer="MONDI",
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

Enter the password to continue.""",
        order=0,
        unlock_mode="text",
        answer="GRANDPA",
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

Enter the password to continue.""",
        order=0,
        unlock_mode="text",
        answer="BAGGIE",
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
# STOP 1D — MURAL + PHOTO PROMPT (200/303 Anastasia Blvd)
# ═══════════════════════════════════════════════════════════
stop1d_pages = [
    page(
        title="",
        content="""One more. Billy won his first Grammy for Best Bluegrass Album. What was the album called?

A — Renewal
B — Turmoil and Tinfoil
C — Home
D — Me/And/Dad

Enter the password to continue.""",
        order=0,
        unlock_mode="text",
        answer="HOME",
    ),
    page(
        title="",
        content="""Take a photo of your crew with this mural. Send it to: mysteryserved@gmail.com
Subject line: ST. AUGUSTINE MURALS""",
        order=1,
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
# TRANSITION — THE BRIDGE
# ═══════════════════════════════════════════════════════════
bridge_pages = [
    page(
        title="",
        content="""head toward the water
cross the bridge
something changes when you cross water""",
        order=0,
    ),
]

bridge = {
    "id": str(uuid.uuid4()),
    "title": "THE BRIDGE",
    "description": "",
    "order": 4,
    "unlockMode": "continue",
    "storyMode": True,
    "pages": bridge_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 2 — CASTILLO
# ═══════════════════════════════════════════════════════════
stop2_pages = [
    page(
        title="",
        content="""Go to the fort. Stay outside near the water. Terry Barber is the man who taught Billy Strings to play guitar. What is Terry to Billy?

A — His biological father
B — His uncle on his mother's side
C — His stepfather
D — His first band manager

Enter the password to continue.""",
        order=0,
        unlock_mode="text",
        answer="STEPFATHER",
    ),
]

stop2 = {
    "id": str(uuid.uuid4()),
    "title": "CASTILLO",
    "description": "1 S Castillo Dr, St. Augustine FL",
    "order": 5,
    "unlockMode": "continue",
    "pages": stop2_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 3 — PLAZA
# ═══════════════════════════════════════════════════════════
stop3_pages = [
    page(
        title="",
        content="""Go to the plaza. This is the oldest city in the country. People have been standing in this spot for centuries. Before she was known as Billy's wife, Ally Dale had a specific job working with his band. What was it?

A — Sound engineer
B — Social media manager
C — Tour manager
D — Booking agent

Enter the password to continue.""",
        order=0,
        unlock_mode="text",
        answer="MANAGER",
    ),
]

stop3 = {
    "id": str(uuid.uuid4()),
    "title": "PLAZA",
    "description": "Plaza de la Constitucion, St. Augustine FL",
    "order": 6,
    "unlockMode": "continue",
    "pages": stop3_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 4 — AVILES STREET
# ═══════════════════════════════════════════════════════════
stop4_pages = [
    page(
        title="",
        content="""Go to Aviles Street. Oldest street in the country. You have come a long way from those murals. Billy Strings was born in Lansing Michigan and grew up all over the state. Where does he live now?

A — Asheville NC
B — Nashville TN
C — Marquette MI
D — Austin TX

Enter the password to continue.""",
        order=0,
        unlock_mode="text",
        answer="NASHVILLE",
    ),
]

stop4 = {
    "id": str(uuid.uuid4()),
    "title": "AVILES STREET",
    "description": "Aviles Street, St. Augustine FL",
    "order": 7,
    "unlockMode": "continue",
    "pages": stop4_pages,
}

# ═══════════════════════════════════════════════════════════
# SCREEN — FINAL
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
    "order": 8,
    "unlockMode": "continue",
    "storyMode": True,
    "pages": final_pages,
}

# ═══════════════════════════════════════════════════════════
# ASSEMBLE & UPDATE TOUR
# ═══════════════════════════════════════════════════════════
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
    "stops": [stop1a, stop1b, stop1c, stop1d, bridge, stop2, stop3, stop4, final_stop],
}

update_resp = requests.put(f"{API}/tours/{tour_id}", json=tour_update, headers=headers)
assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"

result = update_resp.json()
print(f"\nTour created and published successfully!")
print(f"Tour ID: {tour_id}")
print(f"Title: {result['title']}")
print(f"Stops: {len(result['stops'])}")
for s in result['stops']:
    print(f"  Stop {s['order']+1}: {s['title']} ({len(s['pages'])} pages)")
print(f"\nPlayer URL: {API_URL}/play/{tour_id}")
