from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, status
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
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    FARMER = "farmer"
    SUPPLIER = "supplier"
    BUYER = "buyer"

class ProduceCategory(str, Enum):
    GRAINS = "grains"
    VEGETABLES = "vegetables"
    FRUITS = "fruits"
    LIVESTOCK = "livestock"

class Region(str, Enum):
    ACCRA = "accra"
    ASHANTI = "ashanti"
    WESTERN = "western"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    name: str
    role: UserRole
    phone: str
    region: Region
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole
    phone: str
    region: Region

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    phone: str
    region: Region
    created_at: datetime
    is_active: bool

class Produce(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farmer_id: str
    farmer_name: str
    title: str
    category: ProduceCategory
    description: str
    price: float
    quantity: int
    unit: str  # kg, bags, pieces, etc.
    region: Region
    image_data: Optional[str] = None  # base64 encoded image
    unique_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_available: bool = True

class ProduceCreate(BaseModel):
    title: str
    category: ProduceCategory
    description: str
    price: float
    quantity: int
    unit: str
    image_data: Optional[str] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    produce_id: str
    farmer_id: str
    buyer_id: str
    buyer_name: str
    farmer_name: str
    produce_title: str
    quantity: int
    unit_price: float
    total_amount: float
    status: OrderStatus
    payment_reference: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    produce_id: str
    quantity: int

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return UserResponse(**user)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Authentication Routes
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_dict["password"])
    user_obj = User(**user_dict)
    
    await db.users.insert_one(user_obj.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user_obj.dict())
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user_credentials: UserLogin):
    # Find user by email
    user = await db.users.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user)
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    return current_user

# Produce Routes
@api_router.post("/produce", response_model=Produce)
async def create_produce(produce_data: ProduceCreate, current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != UserRole.FARMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can create produce listings"
        )
    
    produce_dict = produce_data.dict()
    produce_dict["farmer_id"] = current_user.id
    produce_dict["farmer_name"] = current_user.name
    produce_dict["region"] = current_user.region
    
    produce_obj = Produce(**produce_dict)
    await db.produce.insert_one(produce_obj.dict())
    
    return produce_obj

@api_router.get("/produce", response_model=List[Produce])
async def get_all_produce(
    category: Optional[ProduceCategory] = None,
    region: Optional[Region] = None,
    search: Optional[str] = None
):
    query = {"is_available": True}
    
    if category:
        query["category"] = category
    if region:
        query["region"] = region
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    produce_list = await db.produce.find(query).to_list(1000)
    return [Produce(**produce) for produce in produce_list]

@api_router.get("/produce/{produce_id}", response_model=Produce)
async def get_produce(produce_id: str):
    produce = await db.produce.find_one({"id": produce_id})
    if not produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce not found"
        )
    return Produce(**produce)

@api_router.get("/produce/farmer/{farmer_id}", response_model=List[Produce])
async def get_farmer_produce(farmer_id: str):
    produce_list = await db.produce.find({"farmer_id": farmer_id}).to_list(1000)
    return [Produce(**produce) for produce in produce_list]

@api_router.put("/produce/{produce_id}", response_model=Produce)
async def update_produce(
    produce_id: str,
    produce_data: ProduceCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    produce = await db.produce.find_one({"id": produce_id})
    if not produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce not found"
        )
    
    if produce["farmer_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this produce"
        )
    
    update_data = produce_data.dict()
    await db.produce.update_one(
        {"id": produce_id},
        {"$set": update_data}
    )
    
    updated_produce = await db.produce.find_one({"id": produce_id})
    return Produce(**updated_produce)

# Order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(
    order_data: OrderCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != UserRole.BUYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can create orders"
        )
    
    # Get produce details
    produce = await db.produce.find_one({"id": order_data.produce_id})
    if not produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce not found"
        )
    
    if not produce["is_available"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Produce is not available"
        )
    
    if order_data.quantity > produce["quantity"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available stock"
        )
    
    # Calculate total amount
    total_amount = order_data.quantity * produce["price"]
    
    # Create order
    order_dict = {
        "produce_id": order_data.produce_id,
        "farmer_id": produce["farmer_id"],
        "buyer_id": current_user.id,
        "buyer_name": current_user.name,
        "farmer_name": produce["farmer_name"],
        "produce_title": produce["title"],
        "quantity": order_data.quantity,
        "unit_price": produce["price"],
        "total_amount": total_amount,
        "status": OrderStatus.PENDING
    }
    
    order_obj = Order(**order_dict)
    await db.orders.insert_one(order_obj.dict())
    
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role == UserRole.BUYER:
        orders = await db.orders.find({"buyer_id": current_user.id}).to_list(1000)
    elif current_user.role == UserRole.FARMER:
        orders = await db.orders.find({"farmer_id": current_user.id}).to_list(1000)
    else:
        orders = []
    
    return [Order(**order) for order in orders]

@api_router.put("/orders/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str,
    status: OrderStatus,
    current_user: UserResponse = Depends(get_current_user)
):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check authorization
    if current_user.role == UserRole.FARMER and order["farmer_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this order"
        )
    elif current_user.role == UserRole.BUYER and order["buyer_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this order"
        )
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    updated_order = await db.orders.find_one({"id": order_id})
    return Order(**updated_order)

# Dashboard Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: UserResponse = Depends(get_current_user)):
    stats = {}
    
    if current_user.role == UserRole.FARMER:
        # Farmer stats
        total_produce = await db.produce.count_documents({"farmer_id": current_user.id})
        active_produce = await db.produce.count_documents({"farmer_id": current_user.id, "is_available": True})
        total_orders = await db.orders.count_documents({"farmer_id": current_user.id})
        pending_orders = await db.orders.count_documents({"farmer_id": current_user.id, "status": OrderStatus.PENDING})
        
        stats = {
            "total_produce": total_produce,
            "active_produce": active_produce,
            "total_orders": total_orders,
            "pending_orders": pending_orders
        }
    
    elif current_user.role == UserRole.BUYER:
        # Buyer stats
        total_orders = await db.orders.count_documents({"buyer_id": current_user.id})
        pending_orders = await db.orders.count_documents({"buyer_id": current_user.id, "status": OrderStatus.PENDING})
        completed_orders = await db.orders.count_documents({"buyer_id": current_user.id, "status": OrderStatus.DELIVERED})
        
        stats = {
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders
        }
    
    return stats

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()