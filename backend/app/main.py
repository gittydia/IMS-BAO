from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from prisma import Prisma
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from decimal import Decimal
import uvicorn
import hashlib

app = FastAPI(title="IMS-BAO API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global database instance
db = Prisma()

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

# Simple session storage (in production, use Redis or database)
sessions = {}

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

async def get_current_user(request: Request):
    # Try to get session_id from cookies first, then from X-Session-Id header
    session_id = request.cookies.get("session_id") or request.headers.get("X-Session-Id")
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return sessions[session_id]

async def require_role(role: str):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return current_user
    return role_checker

# Pydantic models for request/response
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # "admin" or "student"
    firstname: str
    lastname: str
    college: Optional[str] = None
    program: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class StudentCreate(BaseModel):
    firstname: str
    lastname: str
    college: str
    program: str

class StudentUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    college: Optional[str] = None
    program: Optional[str] = None

class ProductCreate(BaseModel):
    productName: str
    productCategory: str
    price: float
    status: str
    quantity: int

class ProductUpdate(BaseModel):
    productName: Optional[str] = None
    productCategory: Optional[str] = None
    price: Optional[float] = None
    status: Optional[str] = None
    quantity: Optional[int] = None

class OrderCreate(BaseModel):
    productId: int
    dateToClaim: str
    status: str
    amount: float

class OrderUpdate(BaseModel):
    dateClaimed: Optional[str] = None
    status: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to IMS-BAO API"}

# ===== AUTHENTICATION ROUTES =====
@app.post("/auth/register")
async def register(request: RegisterRequest):
    # Check if email already exists
    existing_user = await db.authuser.find_unique(where={'email': request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if request.role not in ["admin", "student"]:
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'student'")
    
    # Create auth user
    auth_user = await db.authuser.create(
        data={
            'email': request.email,
            'password': hash_password(request.password),
            'role': request.role,
        }
    )
    
    # Create role-specific record
    if request.role == "admin":
        admin = await db.admin.create(
            data={
                'firstname': request.firstname,
                'lastname': request.lastname,
                'userId': auth_user.id,
            }
        )
        entity_id = admin.adminId
    else:  # student
        if not request.college or not request.program:
            raise HTTPException(status_code=400, detail="College and program required for students")
        student = await db.student.create(
            data={
                'firstname': request.firstname,
                'lastname': request.lastname,
                'college': request.college,
                'program': request.program,
                'userId': auth_user.id,
            }
        )
        entity_id = student.studentId
    
    return {
        "message": "Registration successful",
        "user": {
            "id": auth_user.id,
            "email": auth_user.email,
            "role": auth_user.role,
            "entity_id": entity_id
        }
    }

@app.post("/auth/login")
async def login(request: LoginRequest):
    # Find user
    user = await db.authuser.find_unique(where={'email': request.email})
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Get role-specific data
    entity_id = None
    entity_data = None
    if user.role == "admin":
        admin = await db.admin.find_first(where={'userId': user.id})
        if admin:
            entity_id = admin.adminId
            entity_data = {"firstname": admin.firstname, "lastname": admin.lastname}
    else:
        student = await db.student.find_first(where={'userId': user.id})
        if student:
            entity_id = student.studentId
            entity_data = {
                "firstname": student.firstname,
                "lastname": student.lastname,
                "college": student.college,
                "program": student.program
            }
    
    # Create session
    session_id = hashlib.sha256(f"{user.email}{datetime.now()}".encode()).hexdigest()
    sessions[session_id] = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "entity_id": entity_id,
        "entity_data": entity_data
    }
    
    return {
        "message": "Login successful",
        "session_id": session_id,
        "user": sessions[session_id]
    }

@app.post("/auth/logout")
async def logout(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id and session_id in sessions:
        del sessions[session_id]
    return {"message": "Logged out successfully"}

@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ===== STUDENTS CRUD =====
@app.get("/students")
async def get_students(current_user: dict = Depends(get_current_user)):
    # Only admins can view all students
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    students = await db.student.find_many()
    return students

@app.get("/students/{student_id}")
async def get_student(student_id: int, current_user: dict = Depends(get_current_user)):
    # Admins can view any student, students can only view themselves
    if current_user["role"] == "student" and current_user["entity_id"] != student_id:
        raise HTTPException(status_code=403, detail="Can only view your own profile")
    
    student = await db.student.find_unique(where={'studentId': student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.post("/students")
async def create_student(student: StudentCreate):
    new_student = await db.student.create(
        data={
            'firstname': student.firstname,
            'lastname': student.lastname,
            'college': student.college,
            'program': student.program,
        }
    )
    return new_student

@app.put("/students/{student_id}")
async def update_student(student_id: int, student: StudentUpdate, current_user: dict = Depends(get_current_user)):
    # Students can only update themselves, admins can update any
    if current_user["role"] == "student" and current_user["entity_id"] != student_id:
        raise HTTPException(status_code=403, detail="Can only update your own profile")
    
    existing = await db.student.find_unique(where={'studentId': student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = {k: v for k, v in student.dict().items() if v is not None}
    updated_student = await db.student.update(
        where={'studentId': student_id},
        data=update_data
    )
    return updated_student

@app.delete("/students/{student_id}")
async def delete_student(student_id: int, current_user: dict = Depends(get_current_user)):
    # Only admins can delete students
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.student.find_unique(where={'studentId': student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.student.delete(where={'studentId': student_id})
    return {"message": "Student deleted successfully"}

# ===== PRODUCTS CRUD =====
@app.get("/products")
async def get_products(current_user: dict = Depends(get_current_user)):
    # Both roles can view products
    products = await db.product.find_many()
    return products

@app.get("/products/{product_id}")
async def get_product(product_id: int):
    product = await db.product.find_unique(where={'productId': product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/products")
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    # Only admins can create products
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_product = await db.product.create(
        data={
            'productName': product.productName,
            'productCategory': product.productCategory,
            'price': Decimal(str(product.price)),
            'status': product.status,
            'quantity': product.quantity,
        }
    )
    return new_product

@app.put("/products/{product_id}")
async def update_product(product_id: int, product: ProductUpdate, current_user: dict = Depends(get_current_user)):
    # Only admins can update products
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.product.find_unique(where={'productId': product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product.dict().items() if v is not None}
    if 'price' in update_data and update_data['price'] is not None:
        update_data['price'] = Decimal(str(update_data['price']))
    
    updated_product = await db.product.update(
        where={'productId': product_id},
        data=update_data
    )
    return updated_product

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, current_user: dict = Depends(get_current_user)):
    # Only admins can delete products
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.product.find_unique(where={'productId': product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.product.delete(where={'productId': product_id})
    return {"message": "Product deleted successfully"}

# ===== ORDERS CRUD =====
@app.get("/orders")
async def get_orders():
    orders = await db.order.find_many(include={'product': True})
    return orders

@app.get("/orders/{order_id}")
async def get_order(order_id: int):
    order = await db.order.find_unique(
        where={'orderId': order_id},
        include={'product': True}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/orders")
async def create_order(order: OrderCreate):
    new_order = await db.order.create(
        data={
            'productId': order.productId,
            'dateToClaim': datetime.fromisoformat(order.dateToClaim),
            'status': order.status,
            'amount': Decimal(str(order.amount)),
        }
    )
    return new_order

@app.put("/orders/{order_id}")
async def update_order(order_id: int, order: OrderUpdate):
    existing = await db.order.find_unique(where={'orderId': order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {}
    if order.dateClaimed:
        update_data['dateClaimed'] = datetime.fromisoformat(order.dateClaimed)
    if order.status:
        update_data['status'] = order.status
    
    updated_order = await db.order.update(
        where={'orderId': order_id},
        data=update_data
    )
    return updated_order

@app.delete("/orders/{order_id}")
async def delete_order(order_id: int):
    existing = await db.order.find_unique(where={'orderId': order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.order.delete(where={'orderId': order_id})
    return {"message": "Order deleted successfully"}

if __name__ == "__main__":
    uvicorn.run("crud:app", host="0.0.0.0", port=8000, reload=True)