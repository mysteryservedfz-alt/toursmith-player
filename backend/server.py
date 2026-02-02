from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
JWT_SECRET = os.environ.get('JWT_SECRET', 'toursmith-secret-key-change-in-production')
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
    unlockMode: Optional[str] = None  # None = inherit, "continue", "text", "multiple_choice", "whiteboard"
    answer: Optional[str] = None
    caseInsensitive: bool = True  # Case-insensitive answer matching
    # Multiple choice options
    mcOptions: Optional[List[str]] = None  # List of options for multiple choice
    mcCorrectIndex: Optional[int] = None  # Index of correct answer (0-based)
    # Hint settings
    hintText: Optional[str] = None
    autoShowHint: bool = False
    # Story mode (bypass verification)
    storyMode: bool = False
    order: int = 0

class Stop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    subtitle: Optional[str] = None
    description: str = ""  # intro
    intro2: Optional[str] = None
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
    unlockMode: str = "continue"  # "continue", "text", "multiple_choice", "whiteboard"
    answer: Optional[str] = None
    caseInsensitive: bool = True  # Case-insensitive answer matching
    # Multiple choice options
    mcOptions: Optional[List[str]] = None  # List of options for multiple choice
    mcCorrectIndex: Optional[int] = None  # Index of correct answer (0-based)
    # Hint settings
    hintText: Optional[str] = None
    autoShowHint: bool = False
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
    admin = await db.admins.find_one({}, {"_id": 0})
    return {"exists": admin is not None}

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

# ==================== TOUR ROUTES ====================

@api_router.get("/tours", response_model=List[Tour])
async def get_tours(username: str = Depends(verify_token)):
    """Get all tours"""
    tours = await db.tours.find({}, {"_id": 0}).to_list(1000)
    return tours

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
    
    # Only update fields that are not None, EXCEPT for specific clearable fields
    clearable_fields = {'welcomeImageUrl', 'welcomeAudioUrl', 'welcomeTitle', 'welcomeBody', 
                        'welcomeButtonLabel', 'welcomeGpsLat', 'welcomeGpsLng',
                        'completionTitle', 'completionBody', 'completionImageUrl', 
                        'completionButtonLabel', 'completionButtonUrl'}
    
    final_update = {}
    for k, v in update_data.items():
        if v is not None:
            final_update[k] = v
        elif k in clearable_fields:
            # Allow these fields to be explicitly set to None/null
            final_update[k] = None
    
    await db.tours.update_one({"id": tour_id}, {"$set": final_update})
    updated = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    return updated

@api_router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: str, username: str = Depends(verify_token)):
    """Delete a tour"""
    result = await db.tours.delete_one({"id": tour_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    return {"success": True}

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
    return tour

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
