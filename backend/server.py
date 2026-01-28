from fastapi import FastAPI, APIRouter, HTTPException, Depends
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
import jwt
import bcrypt

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

# ============ MODELS ============

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TokenResponse(BaseModel):
    token: str
    email: str

class Tour(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    city: str = ""
    difficulty: str = "easy"
    intro_story: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TourCreate(BaseModel):
    name: str = ""
    city: str = ""
    difficulty: str = "easy"
    intro_story: str = ""

class TourUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    difficulty: Optional[str] = None
    intro_story: Optional[str] = None

class Stop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tour_id: str
    title: str = ""
    guest_instructions: str = ""
    puzzle_text: str = ""
    answer_code: str = ""
    hints: str = ""
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StopCreate(BaseModel):
    tour_id: str
    title: str = ""
    guest_instructions: str = ""
    puzzle_text: str = ""
    answer_code: str = ""
    hints: str = ""
    order: int = 0

class StopUpdate(BaseModel):
    title: Optional[str] = None
    guest_instructions: Optional[str] = None
    puzzle_text: Optional[str] = None
    answer_code: Optional[str] = None
    hints: Optional[str] = None
    order: Optional[int] = None

class ReorderStops(BaseModel):
    stop_ids: List[str]

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_token(email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"email": email, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.admins.find_one({"email": email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: AdminLogin):
    user = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(data.email)
    return TokenResponse(token=token, email=data.email)

@api_router.post("/auth/setup")
async def setup_admin(data: AdminLogin):
    """Create first admin user if none exists"""
    existing = await db.admins.find_one({})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    admin = AdminUser(email=data.email, password_hash=hash_password(data.password))
    await db.admins.insert_one(admin.model_dump())
    return {"message": "Admin created successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"email": user["email"]}

# ============ TOURS CRUD ============

@api_router.get("/tours", response_model=List[Tour])
async def get_tours(user: dict = Depends(get_current_user)):
    tours = await db.tours.find({}, {"_id": 0}).to_list(1000)
    return tours

@api_router.post("/tours", response_model=Tour)
async def create_tour(data: TourCreate, user: dict = Depends(get_current_user)):
    tour = Tour(**data.model_dump())
    await db.tours.insert_one(tour.model_dump())
    return tour

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str, user: dict = Depends(get_current_user)):
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour

@api_router.patch("/tours/{tour_id}", response_model=Tour)
async def update_tour(tour_id: str, data: TourUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
        return tour
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tours.update_one({"id": tour_id}, {"$set": update_data})
    tour = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour

@api_router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: str, user: dict = Depends(get_current_user)):
    result = await db.tours.delete_one({"id": tour_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    # Delete all stops for this tour
    await db.stops.delete_many({"tour_id": tour_id})
    return {"message": "Tour deleted"}

@api_router.post("/tours/{tour_id}/duplicate", response_model=Tour)
async def duplicate_tour(tour_id: str, user: dict = Depends(get_current_user)):
    original = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Create new tour
    new_tour = Tour(
        name=f"{original['name']} (Copy)",
        city=original["city"],
        difficulty=original["difficulty"],
        intro_story=original["intro_story"]
    )
    await db.tours.insert_one(new_tour.model_dump())
    
    # Copy all stops
    stops = await db.stops.find({"tour_id": tour_id}, {"_id": 0}).to_list(1000)
    for stop in stops:
        new_stop = Stop(
            tour_id=new_tour.id,
            title=stop["title"],
            guest_instructions=stop["guest_instructions"],
            puzzle_text=stop["puzzle_text"],
            answer_code=stop["answer_code"],
            hints=stop["hints"],
            order=stop["order"]
        )
        await db.stops.insert_one(new_stop.model_dump())
    
    return new_tour

# ============ STOPS CRUD ============

@api_router.get("/tours/{tour_id}/stops", response_model=List[Stop])
async def get_stops(tour_id: str, user: dict = Depends(get_current_user)):
    stops = await db.stops.find({"tour_id": tour_id}, {"_id": 0}).sort("order", 1).to_list(1000)
    return stops

@api_router.post("/tours/{tour_id}/stops", response_model=Stop)
async def create_stop(tour_id: str, data: StopCreate, user: dict = Depends(get_current_user)):
    # Get max order
    last_stop = await db.stops.find({"tour_id": tour_id}).sort("order", -1).limit(1).to_list(1)
    next_order = (last_stop[0]["order"] + 1) if last_stop else 0
    
    stop = Stop(tour_id=tour_id, order=next_order, **{k: v for k, v in data.model_dump().items() if k not in ["tour_id", "order"]})
    await db.stops.insert_one(stop.model_dump())
    return stop

@api_router.patch("/stops/{stop_id}", response_model=Stop)
async def update_stop(stop_id: str, data: StopUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        stop = await db.stops.find_one({"id": stop_id}, {"_id": 0})
        return stop
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.stops.update_one({"id": stop_id}, {"$set": update_data})
    stop = await db.stops.find_one({"id": stop_id}, {"_id": 0})
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    return stop

@api_router.delete("/stops/{stop_id}")
async def delete_stop(stop_id: str, user: dict = Depends(get_current_user)):
    result = await db.stops.delete_one({"id": stop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stop not found")
    return {"message": "Stop deleted"}

@api_router.post("/tours/{tour_id}/stops/reorder")
async def reorder_stops(tour_id: str, data: ReorderStops, user: dict = Depends(get_current_user)):
    for index, stop_id in enumerate(data.stop_ids):
        await db.stops.update_one(
            {"id": stop_id, "tour_id": tour_id},
            {"$set": {"order": index, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"message": "Stops reordered"}

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "Toursmith Admin API"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
