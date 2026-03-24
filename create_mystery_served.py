#!/usr/bin/env python3
"""Create the Mystery Served - The Recipe Conspiracy tour via API."""

import requests
import json
import uuid
import os

API_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://story-builder-dev.preview.emergentagent.com")
API = f"{API_URL}/api"

# Login
login_resp = requests.post(f"{API}/admin/login", json={"username": "demo", "password": "demo123"})
assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
token = login_resp.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Create tour
create_resp = requests.post(f"{API}/tours", json={"title": "The Recipe Conspiracy", "description": "Mystery Served — GPS-activated neighborhood mystery experience — 5 stops — St. Petersburg, FL"}, headers=headers)
assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
tour = create_resp.json()
tour_id = tour["id"]
print(f"Created tour: {tour_id}")

# Build full tour data
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
# STOP 1 — Hawkers Asian Street Food
# ═══════════════════════════════════════════════════════════
stop1_pages = [
    page(
        title="",
        content="Hannah moved through this neighborhood on foot. You will too.\n\nHawkers Asian Street Food\n1235 Central Ave\n\nWalk in. Tell them you're with Mystery Served.\nThey'll take it from there.",
        order=0,
    ),
    page(
        title="",
        content="""They didn't know Hannah's story.

But they knew her.

They knew her order. Her table. That she tipped well and never complained.

What they didn't know was what she was paying attention to.

For two years she moved through this neighborhood quietly.

Eating. Listening. Noticing things most people walk right past.

The morning she disappeared she left an envelope.

Sealed.

One line written on the front:

OPEN IF SOMEONE COMES ASKING

You came asking.

Inside you'll find your lanyard. Put it on. You'll wear it for the rest of the tour — it's how each stop knows you're with the agency.""",
        order=1,
    ),
    page(
        title="",
        content="""She came back three times before she trusted this place.
On her first visit she barely spoke.
By her fourth meal they already knew her order.
Once more she came back — and then she was gone.

She already told you how to read it.

Look at what she left. Look at these words carefully.

When it clicks, you'll know what to do.""",
        order=2,
        unlock_mode="text",
        answer="ABRA",
        hint="Hannah numbered her lists for a reason.",
    ),
    page(
        title="",
        content="""Work through your worksheets.

Each one gives you a word.
Take the first letter.
Combine all four letters on Worksheet 4.

When you have the word — enter it below.""",
        order=3,
        unlock_mode="text",
        answer="GOLD",
    ),
    page(
        title="",
        content="""You saw it.
Most people wouldn't have.

This was one of the places she came back to.
Not because she had to.
Because something here mattered.

Whatever she noticed was enough to bring her back again.

Finish up here.
Then keep moving.

Not hidden. Just rearranged.

When you arrive at Bodega — break the seal on Stop 2.""",
        order=4,
    ),
    page(
        title="",
        content="""She didn't stay in one place long.
When she found something, she moved.
The next place wasn't far.
But it wasn't random either.
She chose it.
Carefully.

─────────────────────────────
YOUR NEXT STOP

Bodega on Central
Walk-up window · Cuban sandwiches

Stay on Central Ave. Bodega is nearby.
Walk up to the window when you arrive.
─────────────────────────────""",
        order=5,
    ),
]

stop1 = {
    "id": str(uuid.uuid4()),
    "title": "Hawkers Asian Street Food",
    "description": "",
    "order": 0,
    "unlockMode": "continue",
    "pages": stop1_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 2 — Bodega on Central
# ═══════════════════════════════════════════════════════════
stop2_pages = [
    page(
        title="",
        content="""This stop is different.

No table waiting for you. No envelope handed over.

You order first. Then you wait.

Something will arrive. You'll know it when you see it.

Stay together. Eyes open.
Not everything gets handed to you.

─────────────────────────────
Walk up to the window.
Cuban sandwiches. You'll want one. Half each.
Tell them any preferences when you order.

Then say the name:

HOUDINI

Say it exactly.
They will know exactly who you are.

Order first. Then sit down.
Your box will arrive shortly.
If nothing shows up by the time your food does — ask for it.
─────────────────────────────""",
        order=0,
    ),
    page(
        title="",
        content="""Hannah left this here.
Locked.
She trusted that the right people would know how to open it.

Inside the envelope is a riddle.
The riddle gives you four numbers.
Four numbers open the lock.

Don't rush this.

What's inside the box — you'll have to see for yourself.

SOLVE THE RIDDLE. OPEN THE LOCK.""",
        order=1,
        unlock_mode="text",
        answer="TBD",
        hint="The lock combination — you have seen this number at a previous stop. Check your booklet.",
    ),
    page(
        title="",
        content="""You opened it.
Most people wouldn't have.
They would've stopped at the obvious.
Hannah didn't.
Now you're starting to see it the way she did.

Finish your food.
Then keep moving.
The next stop is already waiting.

When you arrive at Kalamazoo — break the seal on Stop 3.""",
        order=2,
    ),
    page(
        title="",
        content="""She didn't linger.
When she had what she came for, she moved.
Your next stop is close.

─────────────────────────────
YOUR NEXT STOP

Kalamazoo Olive Co
1008 Central Ave

Stay on the south side of Central Ave.
Walk east past the concrete circle.
Look for Kalamazoo Olive Co. You'll see it.

No ordering here. Just explore.
Maybe Hannah left something — and it's right in clear sight.
─────────────────────────────""",
        order=3,
    ),
]

stop2 = {
    "id": str(uuid.uuid4()),
    "title": "Bodega on Central",
    "description": "",
    "order": 1,
    "unlockMode": "continue",
    "pages": stop2_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 3 — Kalamazoo Olive Co
# ═══════════════════════════════════════════════════════════
stop3_pages = [
    page(
        title="",
        content="""Hannah said this place understood food the way she did.

Honest ingredients. No shortcuts. No lies.

She left something here too.

─────────────────────────────
Go in. Taste everything.
Take your time. No rush here.

Before you leave — let them know you're picking up samples.

If they bring out pre-packaged bags, investigate everything.

Hannah left something and it is going to surprise you.

Open the bag. Even the simple things matter.

Look around. The answer has been here the whole time.
─────────────────────────────""",
        order=0,
    ),
    page(
        title="",
        content="""The bag holds your tool.
The wall holds her secret.
Use one to understand the other.

When you have the word, enter it below.""",
        order=1,
        unlock_mode="text",
        answer="HOCUS",
        hint="Hannah never left a place without noticing something. Look at what's in your hands.",
    ),
    page(
        title="",
        content="""You saw it.

Hannah didn't just taste.
She compared. She chose.
And she paid attention to what came first.

Three down. Two to go.

When you arrive at Poppo's — break the seal on Stop 4.""",
        order=2,
    ),
    page(
        title="",
        content="""─────────────────────────────
YOUR NEXT STOP

Poppo's Taqueria

Walk back toward the concrete circle and cross Central Ave at the crosswalk.
Poppo's is on your left on the north side.

Decide before you arrive.
Hannah's picks: the Baby Burrito, the Basic Taco, or the Cheese Quesadilla.
Everyone picks one. Tell them your preference when you order.

Sit down. Your drinks and your next envelope arrive together.
If it doesn't show up by the time your food does — ask for it.

Fair warning.
This next one is the hardest.
Hannah made sure of it.
─────────────────────────────""",
        order=3,
    ),
]

stop3 = {
    "id": str(uuid.uuid4()),
    "title": "Kalamazoo Olive Co",
    "description": "",
    "order": 2,
    "unlockMode": "continue",
    "pages": stop3_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 4 — Poppo's Taqueria
# ═══════════════════════════════════════════════════════════
stop4_pages = [
    page(
        title="",
        content="""This was Hannah's hardest clue.
She did not make it easy on purpose.

The clock does not lie.
Neither did she.

Figure out what she is pointing to.
It's here.

─────────────────────────────
This was the last place Hannah ate.
Tuesday night. Alone. Corner table.

She was not distracted.
She was not rushed.
She sat there like someone who had already made a decision.

This is where she made sure only the right people would keep going.

Order first. Sit down.
Your envelope and drinks arrive together.
If nothing shows up by the time your food does — ask for it.

FAIR WARNING. THIS IS THE HARDEST ONE. HANNAH MADE SURE OF IT.
─────────────────────────────""",
        order=0,
    ),
    page(
        title="",
        content="""Don't rush this.
Look up.

The bag holds your tool.
The wall holds her secret.
Use one to understand the other.

The clock bag is your tool carrier — not a clue.
Handle it with care. Do not force it open. Do not damage it.
Everything you need is inside it.
The answer is somewhere else entirely.

When you have the word, enter it below.""",
        order=1,
        unlock_mode="text",
        answer="POCUS",
        hint="You've seen the bag combination before. But not like this.",
    ),
    page(
        title="",
        content="""You got through everything she left behind.
Not everyone would have.

One stop left.
No more puzzles.
Just the truth — and something sweet.

When you arrive at Plant Love — break the seal on Stop 5.""",
        order=2,
    ),
    page(
        title="",
        content="""─────────────────────────────
YOUR NEXT STOP

Plant Love Ice Cream

Stay on the north side of Central Ave.
Walk east.
Plant Love Ice Cream is on your right.

Walk up. Pick your scoop.
Vegan and dairy options both available.

You earned it.
─────────────────────────────""",
        order=3,
    ),
]

stop4 = {
    "id": str(uuid.uuid4()),
    "title": "Poppo's Taqueria",
    "description": "",
    "order": 3,
    "unlockMode": "continue",
    "pages": stop4_pages,
}

# ═══════════════════════════════════════════════════════════
# STOP 5 — Plant Love Ice Cream
# ═══════════════════════════════════════════════════════════
stop5_pages = [
    page(
        title="",
        content="""No more puzzles.
No more codes.
No more locked boxes.

Just the truth.
And something sweet.

You earned both.

Walk up. Pick your scoop.
Vegan and dairy both available.""",
        order=0,
    ),
    page(
        title="",
        content="""You did what most people would not.
You paid attention.

And now — look at what you have been saying all along.

From the very beginning —

ABRA · HOUDINI · HOCUS · POCUS · ______

You were magicians the whole time.
You just didn't know it yet.""",
        order=1,
        unlock_mode="text",
        answer="CADABRA",
    ),
    page(
        title="",
        content="""You did what most people would not.
You paid attention.

Hannah did not disappear because something went wrong.
She stepped back.
She wanted to see if anyone would notice what she spent years building — the food, the people, the places that actually mattered.

At Hawkers — in every bowl she helped shape.
At Bodega — in every sandwich still made the way she insisted.
At Kalamazoo — in the oils she chose carefully.
At Poppo's — in the food she kept coming back to.

Hannah didn't disappear.
She stepped back to see if anyone would notice.

Most people wouldn't have.
You did.

That is rare.

— Mystery Served

Look around.
This was always the point.""",
        order=2,
    ),
]

stop5 = {
    "id": str(uuid.uuid4()),
    "title": "Plant Love Ice Cream",
    "description": "",
    "order": 4,
    "unlockMode": "continue",
    "pages": stop5_pages,
}

# ═══════════════════════════════════════════════════════════
# ASSEMBLE & UPDATE TOUR
# ═══════════════════════════════════════════════════════════
tour_update = {
    "title": "The Recipe Conspiracy",
    "description": "Mystery Served — GPS-activated neighborhood mystery experience — 5 stops — St. Petersburg, FL",
    "status": "published",
    "backgroundColor": "#ffffff",
    "welcomeTitle": "Mystery Served",
    "welcomeBody": "The Recipe Conspiracy<br><br>A neighborhood mystery experience.<br>5 stops. St. Petersburg, FL.<br><br>One person runs the app. Everyone else works the printed booklet.",
    "welcomeButtonLabel": "Begin",
    "completionTitle": "Mystery Served",
    "completionBody": "Thank you for playing.\n\nThis was always the point.",
    "stops": [stop1, stop2, stop3, stop4, stop5],
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
