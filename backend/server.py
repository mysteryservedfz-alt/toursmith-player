from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, JSONResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class AdminSetup(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str
    username: str

class Page(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    subtitle: Optional[str] = None
    content: str = ""  # body
    body2: Optional[str] = None
    # Skin (background image) - overrides tour-level skin
    skinImageUrl: Optional[str] = None
    # Text color
    textColor: Optional[str] = None
    # On-Site Task / Instructions
    taskInstructions: Optional[str] = None
    # Media fields
    mediaType: Optional[str] = None  # "image", "video", "youtube"
    mediaUrl: Optional[str] = None
    imageUrl: Optional[str] = None
    imageAlt: Optional[str] = None
    galleryUrls: Optional[List[str]] = None
    embedUrl: Optional[str] = None
    embedCaption: Optional[str] = None
    audioUrl: Optional[str] = None
    ctaLabel: Optional[str] = None
    ctaUrl: Optional[str] = None
    # Verification settings
    unlockMode: Optional[str] = None  # None = inherit, "continue", "text", "multiple_choice", "whiteboard", "photo", "ranking", "timer", "checklist", "shake"
    answer: Optional[str] = None
    caseInsensitive: bool = True  # Case-insensitive answer matching
    # Multiple choice options
    mcOptions: Optional[List[str]] = None  # List of options for multiple choice
    mcCorrectIndex: Optional[int] = None  # Index of correct answer (0-based)
    # Hint settings
    hintText: Optional[str] = None
    autoShowHint: bool = False
    # Custom feedback messages
    wrongAnswerMessage: Optional[str] = None
    correctAnswerMessage: Optional[str] = None
    # Story mode (bypass verification)
    storyMode: bool = False
    order: int = 0

class Stop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    subtitle: Optional[str] = None
    description: str = ""  # intro
    intro2: Optional[str] = None
    # Text color
    textColor: Optional[str] = None
    # On-Site Task / Instructions
    taskInstructions: Optional[str] = None
    # Media fields
    mediaType: Optional[str] = None  # "image", "video", "youtube"
    mediaUrl: Optional[str] = None
    imageUrl: Optional[str] = None
    imageAlt: Optional[str] = None
    galleryUrls: Optional[List[str]] = None
    embedUrl: Optional[str] = None
    embedCaption: Optional[str] = None
    audioUrl: Optional[str] = None
    ctaLabel: Optional[str] = None
    ctaUrl: Optional[str] = None
    # Verification settings
    unlockMode: str = "continue"  # "continue", "text", "multiple_choice", "whiteboard", "photo", "ranking", "timer", "checklist", "shake"
    answer: Optional[str] = None
    caseInsensitive: bool = True  # Case-insensitive answer matching
    # Multiple choice options
    mcOptions: Optional[List[str]] = None  # List of options for multiple choice
    mcCorrectIndex: Optional[int] = None  # Index of correct answer (0-based)
    # Hint settings
    hintText: Optional[str] = None
    autoShowHint: bool = False
    # Custom feedback messages
    wrongAnswerMessage: Optional[str] = None
    correctAnswerMessage: Optional[str] = None
    # Story mode (bypass verification)
    storyMode: bool = False
    pages: List[Page] = []
    order: int = 0

class Tour(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Untitled Tour"
    description: str = ""
    status: str = "draft"  # "draft" or "published"
    backgroundColor: str = "#ffffff"  # Default white background
    skinImageUrl: Optional[str] = None  # Tour-level default skin (background image)
    logoUrl: Optional[str] = None  # Tour logo for booklet/branding
    allowSkip: bool = True  # Player can skip puzzles if stuck (safety valve)
    # Welcome screen fields
    welcomeTitle: Optional[str] = None
    welcomeBody: Optional[str] = None
    welcomeImageUrl: Optional[str] = None
    welcomeAudioUrl: Optional[str] = None
    welcomeButtonLabel: Optional[str] = None
    # GPS fields
    welcomeGpsEnabled: bool = False
    welcomeGpsLat: Optional[float] = None
    welcomeGpsLng: Optional[float] = None
    welcomeGpsRadiusMeters: Optional[int] = 100
    # Completion screen fields
    completionTitle: Optional[str] = None
    completionBody: Optional[str] = None
    completionImageUrl: Optional[str] = None
    completionButtonLabel: Optional[str] = None
    completionButtonUrl: Optional[str] = None
    stops: List[Stop] = []
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TourCreate(BaseModel):
    title: str = "Untitled Tour"
    description: str = ""

class TourUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    backgroundColor: Optional[str] = None
    skinImageUrl: Optional[str] = None  # Tour-level default skin
    logoUrl: Optional[str] = None
    allowSkip: Optional[bool] = None
    welcomeTitle: Optional[str] = None
    welcomeBody: Optional[str] = None
    welcomeImageUrl: Optional[str] = None
    welcomeAudioUrl: Optional[str] = None
    welcomeButtonLabel: Optional[str] = None
    welcomeGpsEnabled: Optional[bool] = None
    welcomeGpsLat: Optional[float] = None
    welcomeGpsLng: Optional[float] = None
    welcomeGpsRadiusMeters: Optional[int] = None
    completionTitle: Optional[str] = None
    completionBody: Optional[str] = None
    completionImageUrl: Optional[str] = None
    completionButtonLabel: Optional[str] = None
    completionButtonUrl: Optional[str] = None
    stops: Optional[List[Stop]] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(username: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": username, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.get("/admin/exists")
async def check_admin_exists():
    """Check if admin account exists (for first-run setup)"""
    count = await db.admins.count_documents({}, limit=1)
    return {"exists": count > 0}

@api_router.post("/admin/setup", response_model=TokenResponse)
async def setup_admin(data: AdminSetup):
    """First-run admin setup"""
    existing = await db.admins.find_one({})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    hashed = hash_password(data.password)
    await db.admins.insert_one({"username": data.username, "password": hashed})
    token = create_token(data.username)
    return TokenResponse(token=token, username=data.username)

@api_router.post("/admin/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    """Admin login"""
    admin = await db.admins.find_one({"username": data.username}, {"_id": 0})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(data.username)
    return TokenResponse(token=token, username=data.username)

class ChangeCredentials(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_password: Optional[str] = None

@api_router.post("/admin/change-credentials")
async def change_credentials(data: ChangeCredentials, username: str = Depends(verify_token)):
    """Change admin username and/or password"""
    admin = await db.admins.find_one({"username": username})
    if not admin or not verify_password(data.current_password, admin["password"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    update = {}
    if data.new_username:
        update["username"] = data.new_username
    if data.new_password:
        update["password"] = hash_password(data.new_password)
    
    if update:
        await db.admins.update_one({"username": username}, {"$set": update})
        new_username = data.new_username or username
        token = create_token(new_username)
        return {"message": "Credentials updated", "token": token, "username": new_username}
    
    return {"message": "No changes made"}

# ==================== TOUR ROUTES ====================

@api_router.get("/tours")
async def get_tours(username: str = Depends(verify_token), limit: int = 100, skip: int = 0):
    """Get all tours with pagination - returns fields needed for list view plus counts"""
    tours = await db.tours.find(
        {}, 
        {"_id": 0, "id": 1, "title": 1, "description": 1, "status": 1, "createdAt": 1, "updatedAt": 1, "stops": 1}
    ).sort("updatedAt", -1).skip(skip).limit(limit).to_list(limit)
    
    # Calculate stop and page counts, then remove full stops array
    result = []
    for tour in tours:
        stops = tour.get("stops", [])
        stop_count = len(stops)
        page_count = sum(len(stop.get("pages", [])) for stop in stops)
        
        # Remove stops array, add counts
        tour.pop("stops", None)
        tour["stopCount"] = stop_count
        tour["pageCount"] = page_count
        result.append(tour)
    
    return result

@api_router.post("/tours", response_model=Tour)
async def create_tour(data: TourCreate, username: str = Depends(verify_token)):
    """Create a new tour"""
    tour = Tour(title=data.title, description=data.description)
    await db.tours.insert_one(tour.model_dump())
    return tour

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str, username: str = Depends(verify_token)):
    """Get a single tour"""
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour

@api_router.put("/tours/{tour_id}", response_model=Tour)
async def update_tour(tour_id: str, data: TourUpdate, username: str = Depends(verify_token)):
    """Update a tour"""
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Use exclude_unset=False to include explicitly set None values
    # This allows clearing fields by setting them to null
    update_data = data.model_dump()
    
    # Remove fields that weren't sent (still None from default) vs explicitly set to None
    # For simplicity, we'll include all fields from the request
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    
    # Convert stops to dict if present
    if "stops" in update_data and update_data["stops"] is not None:
        update_data["stops"] = [s.model_dump() if hasattr(s, 'model_dump') else s for s in update_data["stops"]]
    
    # Fields that can be explicitly cleared (set to null)
    clearable_fields = {
        'welcomeImageUrl', 'welcomeAudioUrl', 'welcomeTitle', 'welcomeBody', 
        'welcomeButtonLabel', 'welcomeGpsLat', 'welcomeGpsLng',
        'completionTitle', 'completionBody', 'completionImageUrl', 
        'completionButtonLabel', 'completionButtonUrl',
        'skinImageUrl', 'backgroundColor'
    }
    
    final_update = {}
    unset_fields = {}
    
    for k, v in update_data.items():
        if v is not None:
            final_update[k] = v
        elif k in clearable_fields:
            # Use $unset for clearable fields set to null
            unset_fields[k] = ""
    
    # Build the update query
    update_query = {}
    if final_update:
        update_query["$set"] = final_update
    if unset_fields:
        update_query["$unset"] = unset_fields
    
    if update_query:
        await db.tours.update_one({"id": tour_id}, update_query)
    
    updated = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    return updated

@api_router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: str, username: str = Depends(verify_token)):
    """Delete a tour"""
    result = await db.tours.delete_one({"id": tour_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    return {"success": True}

@api_router.get("/tours/{tour_id}/export", response_model=Tour)
async def export_tour(tour_id: str, username: str = Depends(verify_token)):
    """Export a tour as JSON (for cross-environment transfer)"""
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour

class MergeRequest(BaseModel):
    tour_a_id: str
    tour_b_id: str

# ---- Guest Links (Phase 1) ----
class GuestLink(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shortCode: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    tourId: str
    tourTitle: str = ""  # denormalized for dashboard display
    guestLabel: str = ""
    contact: str = ""  # phone or email (private)
    notes: str = ""    # private notes (allergies, anniversary, etc.)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expiresAt: str = ""  # ISO datetime
    purgedAt: Optional[str] = None  # set when manually killed

class GuestLinkCreate(BaseModel):
    guestLabel: str
    durationHours: int = 48
    contact: str = ""
    notes: str = ""

class GuestLinkUpdate(BaseModel):
    guestLabel: Optional[str] = None
    contact: Optional[str] = None
    notes: Optional[str] = None

@api_router.post("/tours/{tour_id}/guest-links", response_model=GuestLink)
async def create_guest_link(tour_id: str, data: GuestLinkCreate, username: str = Depends(verify_token)):
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    hours = max(1, min(data.durationHours, 24 * 30))  # 1h to 30 days
    expires = datetime.now(timezone.utc) + timedelta(hours=hours)
    link = GuestLink(
        tourId=tour_id,
        tourTitle=tour.get("title", ""),
        guestLabel=(data.guestLabel or "").strip() or "Unnamed Guest",
        contact=(data.contact or "").strip(),
        notes=(data.notes or "").strip(),
        expiresAt=expires.isoformat(),
    )
    await db.guest_links.insert_one(link.model_dump())
    return link

@api_router.patch("/guest-links/{link_id}", response_model=GuestLink)
async def update_guest_link(link_id: str, data: GuestLinkUpdate, username: str = Depends(verify_token)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.guest_links.update_one({"id": link_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Guest link not found")
    link = await db.guest_links.find_one({"id": link_id}, {"_id": 0})
    return link

@api_router.get("/tours/{tour_id}/guest-links", response_model=List[GuestLink])
async def list_tour_guest_links(tour_id: str, username: str = Depends(verify_token)):
    cursor = db.guest_links.find({"tourId": tour_id}, {"_id": 0}).sort("createdAt", -1)
    return await cursor.to_list(length=500)

@api_router.get("/guest-links", response_model=List[GuestLink])
async def list_all_guest_links(username: str = Depends(verify_token)):
    cursor = db.guest_links.find({}, {"_id": 0}).sort("createdAt", -1)
    return await cursor.to_list(length=2000)

@api_router.post("/guest-links/{link_id}/purge")
async def purge_guest_link(link_id: str, username: str = Depends(verify_token)):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.guest_links.update_one(
        {"id": link_id}, {"$set": {"purgedAt": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Guest link not found")
    return {"success": True}

@api_router.delete("/guest-links/{link_id}")
async def delete_guest_link(link_id: str, username: str = Depends(verify_token)):
    result = await db.guest_links.delete_one({"id": link_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Guest link not found")
    return {"success": True}

# Public endpoint guests use (no auth). Returns tour content if link is valid.
@api_router.get("/public/guest-links/{short_code}")
async def resolve_guest_link(short_code: str):
    link = await db.guest_links.find_one({"shortCode": short_code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    # Purged?
    if link.get("purgedAt"):
        raise HTTPException(status_code=410, detail="This tour link has been disabled.")
    # Expired?
    try:
        expires = datetime.fromisoformat(link["expiresAt"])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=410, detail="This tour link has expired. Contact your host.")
    except ValueError:
        pass
    tour = await db.tours.find_one({"id": link["tourId"]}, {"_id": 0})
    if not tour or tour.get("status") != "published":
        raise HTTPException(status_code=404, detail="Tour not available")
    return tour


# ==================== IMAGE LIBRARY ====================
# Images stored as binary in MongoDB. Public read (no auth). Auth required for upload/delete.

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

class LibraryImageMeta(BaseModel):
    id: str
    filename: str
    contentType: str
    size: int
    uploadedAt: str
    url: str  # public absolute URL is built client-side; here it's a relative path

@api_router.post("/library/upload", response_model=LibraryImageMeta)
async def library_upload(file: UploadFile = File(...), username: str = Depends(verify_token)):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {content_type}. Use JPG, PNG, GIF, WebP, or SVG.")
    data = await file.read()
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large. Max 10 MB.")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    image_id = uuid.uuid4().hex[:12]
    ext = ALLOWED_IMAGE_TYPES[content_type]
    safe_original = (file.filename or "image").rsplit("/", 1)[-1][:120]
    doc = {
        "id": image_id,
        "ext": ext,
        "filename": safe_original,
        "contentType": content_type,
        "size": len(data),
        "data": data,
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.library_images.insert_one(doc)
    return LibraryImageMeta(
        id=image_id,
        filename=safe_original,
        contentType=content_type,
        size=len(data),
        uploadedAt=doc["uploadedAt"],
        url=f"/api/library/images/{image_id}.{ext}",
    )

@api_router.get("/library/images", response_model=List[LibraryImageMeta])
async def library_list(username: str = Depends(verify_token)):
    cursor = db.library_images.find({}, {"_id": 0, "data": 0}).sort("uploadedAt", -1)
    docs = await cursor.to_list(length=2000)
    return [
        LibraryImageMeta(
            id=d["id"],
            filename=d.get("filename", "image"),
            contentType=d.get("contentType", "application/octet-stream"),
            size=int(d.get("size", 0)),
            uploadedAt=d.get("uploadedAt", ""),
            url=f"/api/library/images/{d['id']}.{d.get('ext','bin')}",
        )
        for d in docs
    ]

@api_router.delete("/library/images/{image_id}")
async def library_delete(image_id: str, username: str = Depends(verify_token)):
    # accept either "abc123" or "abc123.jpg"
    clean_id = image_id.split(".")[0]
    result = await db.library_images.delete_one({"id": clean_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"success": True}

# PUBLIC endpoint — serves the actual image bytes. No auth.
@api_router.get("/library/images/{image_id_with_ext}")
async def library_serve(image_id_with_ext: str):
    clean_id = image_id_with_ext.split(".")[0]
    doc = await db.library_images.find_one({"id": clean_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(
        content=doc["data"],
        media_type=doc.get("contentType", "application/octet-stream"),
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )
# ==================== END IMAGE LIBRARY ====================


@api_router.post("/tours/merge", response_model=Tour)
async def merge_tours(data: MergeRequest, username: str = Depends(verify_token)):
    """
    Merge Tour B into a new copy of Tour A. Originals are kept intact.
    - Stops with matching titles: pages combined; B's page titles get ' (v2)' suffix.
    - New stops from B: appended at the end.
    """
    a = await db.tours.find_one({"id": data.tour_a_id}, {"_id": 0})
    b = await db.tours.find_one({"id": data.tour_b_id}, {"_id": 0})
    if not a or not b:
        raise HTTPException(status_code=404, detail="One or both tours not found")

    # Start with a deep clone of A's content into a brand new tour (fresh IDs)
    merged = Tour(
        title=f"{a.get('title', 'Tour A')} + {b.get('title', 'Tour B')} (Merged)",
        description=a.get("description", ""),
        status="draft",
    )
    # Copy A's tour-level fields
    for k in [
        "backgroundColor", "skinImageUrl", "logoUrl",
        "welcomeTitle", "welcomeBody", "welcomeImageUrl", "welcomeAudioUrl",
        "welcomeButtonLabel", "welcomeGpsEnabled", "welcomeGpsLat",
        "welcomeGpsLng", "welcomeGpsRadiusMeters",
        "completionTitle", "completionBody", "completionImageUrl",
        "completionButtonLabel", "completionButtonUrl",
    ]:
        v = a.get(k)
        if v is not None:
            setattr(merged, k, v)

    # Helper: build a fresh Stop/Page from dict, assigning new IDs
    def new_page_from(p_dict, title_suffix=""):
        d = dict(p_dict)
        d["id"] = str(uuid.uuid4())
        if title_suffix:
            d["title"] = f"{d.get('title') or 'Page'}{title_suffix}"
        return Page(**d)

    def new_stop_from(s_dict):
        d = dict(s_dict)
        d["id"] = str(uuid.uuid4())
        d["pages"] = [new_page_from(p).model_dump() for p in (d.get("pages") or [])]
        return Stop(**d)

    # Seed merged.stops with A's stops (fresh IDs)
    merged_stops: List[Stop] = [new_stop_from(s) for s in (a.get("stops") or [])]

    # Index by title for matching
    def norm(t): return (t or "").strip().lower()
    title_index = {norm(s.title): s for s in merged_stops}

    # Now process B's stops
    for b_stop in (b.get("stops") or []):
        key = norm(b_stop.get("title"))
        if key and key in title_index:
            # Same-named stop -> append B's pages (with ' (v2)' suffix) onto A's existing stop
            target = title_index[key]
            existing_count = len(target.pages)
            for p in (b_stop.get("pages") or []):
                np = new_page_from(p, title_suffix=" (v2)")
                np.order = existing_count
                existing_count += 1
                target.pages.append(np)
        else:
            # Different stop -> append as a brand new stop
            merged_stops.append(new_stop_from(b_stop))

    # Renumber stop order
    for i, s in enumerate(merged_stops):
        s.order = i
    merged.stops = merged_stops

    await db.tours.insert_one(merged.model_dump())
    return merged

class TourImport(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "draft"
    backgroundColor: Optional[str] = None
    skinImageUrl: Optional[str] = None
    logoUrl: Optional[str] = None
    welcomeTitle: Optional[str] = None
    welcomeBody: Optional[str] = None
    welcomeImageUrl: Optional[str] = None
    welcomeAudioUrl: Optional[str] = None
    welcomeButtonLabel: Optional[str] = None
    welcomeGpsEnabled: Optional[bool] = False
    welcomeGpsLat: Optional[float] = None
    welcomeGpsLng: Optional[float] = None
    welcomeGpsRadiusMeters: Optional[int] = 100
    completionTitle: Optional[str] = None
    completionBody: Optional[str] = None
    completionImageUrl: Optional[str] = None
    completionButtonLabel: Optional[str] = None
    completionButtonUrl: Optional[str] = None
    stops: Optional[List[Stop]] = []

@api_router.post("/tours/import", response_model=Tour)
async def import_tour(data: TourImport, username: str = Depends(verify_token)):
    """Import a tour from JSON (for cross-environment transfer). Always creates a new tour with fresh IDs."""
    payload = data.model_dump()
    # Build a fresh Tour to ensure new ID + timestamps
    new_tour = Tour(
        title=payload.get("title") or "Imported Tour",
        description=payload.get("description") or "",
    )
    # Apply optional fields
    for k in [
        "status", "backgroundColor", "skinImageUrl", "logoUrl",
        "welcomeTitle", "welcomeBody", "welcomeImageUrl", "welcomeAudioUrl",
        "welcomeButtonLabel", "welcomeGpsEnabled", "welcomeGpsLat",
        "welcomeGpsLng", "welcomeGpsRadiusMeters",
        "completionTitle", "completionBody", "completionImageUrl",
        "completionButtonLabel", "completionButtonUrl",
    ]:
        v = payload.get(k)
        if v is not None:
            setattr(new_tour, k, v)
    # Reassign fresh IDs to stops + pages so importing twice doesn't collide
    rebuilt_stops: List[Stop] = []
    for s in (payload.get("stops") or []):
        s_dict = s if isinstance(s, dict) else s.model_dump()
        s_dict["id"] = str(uuid.uuid4())
        new_pages = []
        for p in s_dict.get("pages") or []:
            p_dict = p if isinstance(p, dict) else p.model_dump()
            p_dict["id"] = str(uuid.uuid4())
            new_pages.append(Page(**p_dict))
        s_dict["pages"] = [pg.model_dump() for pg in new_pages]
        rebuilt_stops.append(Stop(**s_dict))
    new_tour.stops = rebuilt_stops

    await db.tours.insert_one(new_tour.model_dump())
    return new_tour

@api_router.post("/tours/{tour_id}/duplicate", response_model=Tour)
async def duplicate_tour(tour_id: str, username: str = Depends(verify_token)):
    """Duplicate a tour"""
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Create new tour with new IDs
    new_tour = Tour(
        title=f"{tour['title']} (Copy)",
        description=tour.get("description", ""),
        status="draft",
        stops=[]
    )
    
    # Deep copy stops with new IDs
    for stop in tour.get("stops", []):
        new_stop = Stop(
            title=stop.get("title", ""),
            description=stop.get("description", ""),
            unlockMode=stop.get("unlockMode", "none"),
            unlockPassword=stop.get("unlockPassword"),
            unlockQuestion=stop.get("unlockQuestion"),
            unlockAnswer=stop.get("unlockAnswer"),
            pages=[],
            order=stop.get("order", 0)
        )
        for page in stop.get("pages", []):
            new_page = Page(
                title=page.get("title", ""),
                content=page.get("content", ""),
                unlockMode=page.get("unlockMode"),
                unlockPassword=page.get("unlockPassword"),
                unlockQuestion=page.get("unlockQuestion"),
                unlockAnswer=page.get("unlockAnswer"),
                audioUrl=page.get("audioUrl"),
                order=page.get("order", 0)
            )
            new_stop.pages.append(new_page)
        new_tour.stops.append(new_stop)
    
    await db.tours.insert_one(new_tour.model_dump())
    return new_tour

# ==================== PUBLIC PLAYER ROUTES ====================

@api_router.get("/public/tours/{tour_id}")
async def get_public_tour(tour_id: str):
    """Get a published tour for the player (no auth required)"""
    tour = await db.tours.find_one({"id": tour_id, "status": "published"}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found or not published")
    response = JSONResponse(content=tour)
    response.headers["Cache-Control"] = "public, max-age=300"
    return response

# Share endpoint — serves OG meta tags for link previews
@api_router.get("/share/{tour_id}", response_class=HTMLResponse)
async def share_tour(tour_id: str):
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0, "title": 1, "description": 1, "welcomeBody": 1})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    title = tour.get("title", "Mystery Served Tour")
    description = tour.get("description", "")
    if not description:
        body = tour.get("welcomeBody", "")
        description = body[:200] + "..." if len(body) > 200 else body
    
    player_path = f"/play/{tour_id}"
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
    <meta http-equiv="refresh" content="0;url={player_path}" />
</head>
<body>
    <p>Loading {title}...</p>
    <script>window.location.href = "{player_path}";</script>
</body>
</html>"""
    return HTMLResponse(content=html)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
