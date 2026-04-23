from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel, EmailStr
from resume_agent.utils.db import users_collection
from resume_agent.utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(user: UserRegister):
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user.password)
    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed
    })
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(response: Response, user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(data={"sub": str(db_user["_id"]), "email": db_user["email"], "name": db_user["name"]})
    response.set_cookie(key="auth_token", value=token, httponly=True, max_age=86400, samesite="lax")
    return {"message": "Login successful"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out"}
