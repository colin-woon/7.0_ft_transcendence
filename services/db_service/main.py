import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from contextlib import asynccontextmanager

from src.database import engine, Base
from src.models import User
from src.base_service import BaseService
from src.schemas import UserCreate, UserResponse, UserUpdate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("logic_hub")
app = FastAPI(title="User Service API")




# --- Service Layer ---


class UserService(BaseService):
    def get_all(self) -> List[User]:
        return self.execute_with_db(lambda db: db.query(User).all())

    def get_by_id(self, user_id: int) -> User:
        return self.execute_with_db(lambda db: db.query(User).filter(User.id == user_id).first())

    def create(self, user_data: UserCreate) -> User:
        def action(db):
            # model_dump() converts the Pydantic object to a Python dict
            # ** is the "unpacking" operator (similar to passing a struct by value)
            new_user = User(**user_data.model_dump())
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
        return self.execute_with_db(action)
    
    def update(self, user_id: int, update_data: UserUpdate) -> Optional[User]:
        def action(db):
            db_user = db.query(User).filter(User.id == user_id).first()
            if not db_user:
                return None

            update_dict = update_data.model_dump(exclude_unset=True)

            for key, value in update_dict.items():
                setattr(db_user, key, value)

            db.commit()
            db.refresh(db_user)
            return db_user
        return self.execute_with_db(action)

    def delete(self, user_id: int) -> bool:
        def action(db):
            user = db.query(User).filter(User.id == user_id).first()
            if not user: return False
            db.delete(user)
            db.commit()
            return True
        return self.execute_with_db(action)

user_svc = UserService()

# ---lifespan Handler (not realted if you wanna add api, just ignore this)---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Logic ---
    logger.info("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Logic Hub is live and database is synced.")
    
    yield  # The app runs while it's "paused" here
    
    # --- Shutdown Logic (if needed) ---
    logger.info("Stopping Logic Hub...")

# Initialize the app with the lifespan handler
app = FastAPI(title="User Service API", lifespan=lifespan)




# -------------------- API Routes --------------------

# get all users
@app.get("/users", response_model=List[UserResponse])
def read_users():
    return user_svc.get_all()

# gets user by id
@app.get("/users/{user_id}", response_model=UserResponse)
def read_user(user_id: int):
    user = user_svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# create user
@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    return user_svc.create(user)

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, update_data: UserUpdate):
    updated_user = user_svc.update(user_id, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int):
    if not user_svc.delete(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return None
