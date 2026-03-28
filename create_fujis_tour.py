#!/usr/bin/env python3
"""Create Fuji's Tour with the Billygoats — St. Augustine"""

import requests
import uuid

PREVIEW = "https://story-challenge-hub.preview.emergentagent.com"
DEPLOYED = "https://toursmith-admin.emergent.host"


def pg(content, order, unlock_mode="continue", answer=None, mc_options=None, hint=None):
    p = {
        "id": str(uuid.uuid4()),
        "title": "",
        "content": content,
        "order": order,
        "unlockMode": unlock_mode,
        "caseInsensitive": True,
        "storyMode": unlock_mode == "continue",
    }
    if answer:
        p["answer"] = answer
    if mc_options:
        p["mcOptions"] = mc_options
    if hint:
        p["hintText"] = hint
    return p


# ═══════════════════════════════════════════════════════════
# STOP 0 — YOUR MURAL MAP
# ═══════════════════════════════════════════════════════════
stop_map = {
    "id": str(uuid.uuid4()),
    "title": "YOUR MURAL MAP",
    "description": "",
    "order": 0,
    "unlockMode": "continue",
    "pages": [
        pg("before you start walking — here is your mural map. four stops. all on Anastasia Blvd. ends at the Bridge of Lions. tap here to open it: mysteryserved.com/mural-walk-map start at 512 and walk west toward the bridge. about 20 minutes. flat the whole way. you got this.", 0),
    ],
}

# ═══════════════════════════════════════════════════════════
# STOP 1 — FLAMINGOS AT THE LOCAL
# ═══════════════════════════════════════════════════════════
stop_flamingos = {
    "id": str(uuid.uuid4()),
    "title": "FLAMINGOS AT THE LOCAL",
    "description": "512 Anastasia Blvd — The Local motel",
    "order": 1,
    "unlockMode": "continue",
    "pages": [
        pg("ok so this used to be a 1941 roadside motel. someone bought it in 2021 and instead of tearing it down or turning it into something generic — they brought it back. kept the bones. added color. palm frond wallpaper. bike rentals. a pool that actually makes you want to swim in it. and then they called up a local St. Augustine design crew called Future Friends Co. and said — do something with that wall. so they painted flamingos. a whole flock of them. every single bird in a different stance. some looking left. some looking right. some mid-step. some totally still. but all of them moving together. i think about that a lot when i look at this crowd.", 0),
        pg("take a photo of the flamingos. make it yours. group shot. solo shot. just the wall. whatever feels right.", 1, "photo"),
    ],
}

# ═══════════════════════════════════════════════════════════
# STOP 2 — SARBEZ
# ═══════════════════════════════════════════════════════════
stop_sarbez = {
    "id": str(uuid.uuid4()),
    "title": "SARBEZ",
    "description": "115 Anastasia Blvd — Sarbez",
    "order": 2,
    "unlockMode": "continue",
    "pages": [
        pg("this guy Ryan came from New York to go to art school at Flagler College right here in St. Augustine. graduated 2013. could not make himself leave. so he asked himself — what does this street actually need. and the answer was a place where artists want to hang out. so he built one. grilled cheese. craft beer. old arcade games. live music. art shows. trivia nights. the whole thing. and he painted the outside himself. big bold surrealist geometric stuff you can see from the road when you drive by. the city tried to shut it down. said it did not meet historical code. a whole petition went up. the community went to bat for him. Ryan won. mural stayed. oh and one more thing — Sarbez spelled backwards is Zebras. that was the name of his clothing company when he was a teenager. he was using clothes as his canvas before he had a wall. now he has a wall.", 0),
        pg("""before Billy Strings played bluegrass for thousands of people he played metal in a band as a teenager. what was the name of that band?

A — Wild Bill
B — Dark Hollow
C — Groove Tongue
D — Barefoot Ben

Enter the letter of the correct answer to continue.""", 1, "text", "C"),
    ],
}

# ═══════════════════════════════════════════════════════════
# STOP 3 — LOVE IS THE ANSWER
# ═══════════════════════════════════════════════════════════
stop_love = {
    "id": str(uuid.uuid4()),
    "title": "LOVE IS THE ANSWER",
    "description": "104 Anastasia Blvd — Rochelle's Clothing",
    "order": 3,
    "unlockMode": "continue",
    "pages": [
        pg("Tom and Karen Rochelle have run their clothing boutique on this street for over forty years. in 2016 they looked at that big blank wall and decided to do something with it. they called up Christie Chandler — a local artist who had been a customer of theirs for years — and they sat down together and talked about what they wanted the wall to say to the neighborhood. they landed on four words. Christie painted it 16 feet high and 30 feet wide. finished in 12 days. put in 70 hours. it became one of the most photographed walls in the whole city. now look closely at the design. the word LOVE is hidden inside the mural. not obvious. not labeled. just sitting there in the colors and the movement waiting for someone to actually stop and look. most people walk right past it. you are not most people.", 0),
        pg("the name of this mural is four words. the last word unlocks the next stop. type it below.", 1, "text", "ANSWER", hint="the mural is called Love Is The..."),
    ],
}

# ═══════════════════════════════════════════════════════════
# STOP 4 — THE HOPPER MURAL
# ═══════════════════════════════════════════════════════════
stop_hopper = {
    "id": str(uuid.uuid4()),
    "title": "THE HOPPER MURAL",
    "description": "9 Anastasia Blvd — Gas Full Service Restaurant",
    "order": 4,
    "unlockMode": "continue",
    "pages": [
        pg("ok this one is my favorite. stay with me. there is a painting called Gas. Edward Hopper painted it in 1940. it hangs at the Museum of Modern Art in New York City right now. it is a painting of a gas station at dusk. one man. three red pumps. a road that disappears into dark trees. the light from the station glowing against the coming night. Hopper drove around with his wife for months looking for exactly the right gas station to paint. he wanted to capture something specific — the loneliness of an American road. that feeling of being at the edge of the light wondering whether to keep going. he said his goal was the most exact transcription possible of his most intimate impressions of nature. now look at this building. it used to be a real 1950s gas station. students from Murray Middle School turned the whole exterior into a 30-foot mural — a direct homage to Hopper's painting. deep blues. warm yellows. earthy reds. the same contrast of light and dark Hopper spent years chasing. a world famous painting. reproduced by middle schoolers. on a converted gas station. on Anastasia Boulevard. no gallery. no admission. no velvet rope. just a wall. right here. i love this city.", 0),
        pg("ok i need a favor. take a photo of at least one person in your group with this mural and email it to me.\n\nEmail: mysteryserved@gmail.com\nSubject line: GAS\n\ni will never post it without your permission. if you want to opt out just send a photo of the mural itself — no people needed. totally fine. everyone who sends a photo goes into the raffle for a Billy Strings leather belt.", 1, "photo"),
    ],
}

# ═══════════════════════════════════════════════════════════
# THE BRIDGE — INFO + RANKING
# ═══════════════════════════════════════════════════════════
stop_bridge = {
    "id": str(uuid.uuid4()),
    "title": "THE BRIDGE",
    "description": "",
    "order": 5,
    "unlockMode": "continue",
    "pages": [
        pg("ok you walked Anastasia Boulevard. four murals. four artists. four completely different stories about why someone decided a wall was worth something. i told you you would walk more than you planned. now you are at the Bridge of Lions. built in the 1920s. the lions at the entrance are named Fiel and Firme — Faithful and Firm in Spanish. they have watched every single person cross this bridge for a hundred years. on the other side is the oldest city in the United States. but you gotta earn it first.", 0),
        pg("put Billy Strings' studio albums in order — first to most recent. drag them into the right order.", 1, "ranking", mc_options=[
            "Turmoil and Tinfoil",
            "Home",
            "Renewal",
            "Me/And/Dad",
            "Highway Prayers",
        ]),
    ],
}

# ═══════════════════════════════════════════════════════════
# STOP 5 — CASTILLO — INFO + CHECKLIST
# ═══════════════════════════════════════════════════════════
stop_castillo = {
    "id": str(uuid.uuid4()),
    "title": "CASTILLO",
    "description": "1 S Castillo Dr, St. Augustine FL",
    "order": 6,
    "unlockMode": "continue",
    "pages": [
        pg("go to the fort. stay outside near the water. the Castillo de San Marcos is the oldest masonry fort in the entire continental United States. they started building it in 1672. it is built from a local shellstone called coquina. and here is the thing about coquina — when you fire a cannonball at it the wall does not shatter. it absorbs the hit. the cannonball just gets swallowed. attackers figured this out the hard way. the fort never fell to military force. ever. this city has been under four different flags. burned down. rebuilt. attacked again. and that fort just kept standing there absorbing everything. sounds like somebody's music career.", 0),
        pg("before you leave — check off all three.", 1, "checklist", mc_options=[
            "Find the water. Look back across the Matanzas River toward Anastasia Island — the island you just walked.",
            "Find the coquina. Look at the walls up close. See the shells embedded in the stone.",
            "Find a cannon. There are more than you expect.",
        ]),
    ],
}

# ═══════════════════════════════════════════════════════════
# STOP 6 — PLAZA — INFO + MULTIPLE CHOICE
# ═══════════════════════════════════════════════════════════
stop_plaza = {
    "id": str(uuid.uuid4()),
    "title": "PLAZA DE LA CONSTITUCION",
    "description": "Plaza de la Constitucion, St. Augustine FL",
    "order": 7,
    "unlockMode": "continue",
    "pages": [
        pg("go to the plaza. this is the oldest public square in the United States. people have been gathering here since 1598. Spanish colonists. British merchants. free Black communities. Union soldiers. tourists. locals. all of them standing in basically the same spot you are standing right now. the obelisk in the center goes back to 1812 — commemorating the first time Spanish colonial subjects had rights written down on paper. before Billy Strings was playing arenas he played anywhere that would have him. coffee houses. open mics. bars. empty rooms. he said he would play for nobody because the music was the point. this plaza has seen a lot of people show up before anyone was paying attention.", 0),
        pg("""Billy Strings says the same thing to himself every single night right before he walks on stage. what is it?

A — Stay humble, play hard
B — I ain't afraid of you people
C — For Terry every night
D — Just breathe just play

Enter the letter of the correct answer to continue.""", 1, "text", "B"),
    ],
}

# ═══════════════════════════════════════════════════════════
# STOP 7 — AVILES STREET — INFO + WHITEBOARD
# ═══════════════════════════════════════════════════════════
stop_aviles = {
    "id": str(uuid.uuid4()),
    "title": "AVILES STREET",
    "description": "Aviles Street, St. Augustine FL",
    "order": 8,
    "unlockMode": "continue",
    "pages": [
        pg("Aviles Street is the oldest street in the United States. laid out in 1565. older than the country it is now inside. at the King Street entrance there is a ceramic mural gifted by the city of Aviles Spain — the sister city of St. Augustine and the birthplace of the city's founder. thirty-three artists made it. installed in 2022. thirty-three. same number tattooed on Billy Strings' right forearm. his grandfather's race car number. a number that has followed his family for generations. some numbers just find you.", 0),
        pg("you just walked the oldest street in the country in the oldest city in the country during a Billy Strings weekend. in one word — what does this weekend feel like?", 1, "whiteboard"),
    ],
}

# ═══════════════════════════════════════════════════════════
# ALMOST THERE — SHAKE
# ═══════════════════════════════════════════════════════════
stop_shake = {
    "id": str(uuid.uuid4()),
    "title": "ALMOST THERE",
    "description": "",
    "order": 9,
    "unlockMode": "continue",
    "pages": [
        pg("you can already hear it. shake your phone.", 0, "shake"),
    ],
}

# ═══════════════════════════════════════════════════════════
# ASSEMBLE TOUR
# ═══════════════════════════════════════════════════════════
all_stops = [stop_map, stop_flamingos, stop_sarbez, stop_love, stop_hopper, stop_bridge, stop_castillo, stop_plaza, stop_aviles, stop_shake]

tour_data = {
    "title": "Fuji's Tour with the Billygoats",
    "description": "St. Augustine — Billy Strings Weekend",
    "status": "published",
    "backgroundColor": "#ffffff",
    "welcomeTitle": "Fuji's Tour with the Billygoats",
    "welcomeBody": "hey you. welcome to St. Augustine. so glad you made it this weekend. ok listen — between now and the show tonight there is some really cool stuff hiding on this island that most people just drive right past. we put together a little self-guided tour just for you billygoats. murals. stories. a painting that belongs in a museum that ended up on a gas station wall instead. the oldest street in the country. a fort that swallowed cannonballs. you are gonna walk a little more than you planned. just warning you now. worth it though. grab your crew. follow the stops. pay attention to the walls. this is Fuji's tour with the Billygoats. let's go find some cool stuff.",
    "welcomeButtonLabel": "LET'S GO",
    "completionTitle": "SHAKEDOWN",
    "completionBody": "you made it. you walked the island. you found the art. you crossed a hundred year old bridge. you walked more than you planned. i know. i warned you. now go find your people. find Mystery Served at Shakedown. i am the one with the cool sandals. mysteryserved.com",
    "stops": all_stops,
}

# ═══════════════════════════════════════════════════════════
# PUSH TO BOTH
# ═══════════════════════════════════════════════════════════
for env_name, base_url in [("PREVIEW", PREVIEW), ("DEPLOYED", DEPLOYED)]:
    print(f"\n{'='*50}")
    print(f"Pushing to {env_name}: {base_url}")
    print(f"{'='*50}")

    login = requests.post(f"{base_url}/api/admin/login", json={"username": "demo", "password": "demo123"})
    if login.status_code != 200:
        print(f"  Login failed: {login.text}")
        continue
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create new tour
    create = requests.post(f"{base_url}/api/tours", json={"title": "Fuji's Tour with the Billygoats", "description": "St. Augustine"}, headers=headers)
    tour_id = create.json()["id"]
    print(f"  Created tour: {tour_id}")

    resp = requests.put(f"{base_url}/api/tours/{tour_id}", json=tour_data, headers=headers)
    print(f"  Update status: {resp.status_code}")

    if resp.status_code == 200:
        result = resp.json()
        print(f"  Title: {result['title']}")
        print(f"  Stops: {len(result['stops'])}")
        for s in result['stops']:
            pages = s.get('pages', [])
            modes = [p['unlockMode'] for p in pages if p.get('unlockMode') != 'continue']
            print(f"    {s['order']:2d}. {s['title']:<35} {len(pages)} pages  {', '.join(modes) if modes else 'story'}")
        print(f"  Player: {base_url}/play/{tour_id}")
