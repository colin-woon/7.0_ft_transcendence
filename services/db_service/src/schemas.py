from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


# --- User Schemas ---
# base fields shared by create and response
class UserBase(BaseModel):
    full_name: str
    email: EmailStr # to validate email format
    profile_picture_url: Optional[str] = None
    date_of_birth: Optional[datetime] = None

# what should be received when creating a user (POST request), for now only inheriting from UserBase,
# in the future when want to add confidential stuff like password, ONLY ADD IT HERE else all responses will expose password you bums
class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    date_of_birth: Optional[datetime] = None

# response for the api call (user GET/POST/PUT response), inheriting from UserBase
class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    # tell pydantic to refer to SQLAlchemy model
    model_config = ConfigDict(from_attributes=True)



# --- Project Schemas ---
class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)




# --- ForumPost Schemas ---
class ForumPostBase(BaseModel):
    title: str
    content: str
    project_id: Optional[int] = None # Optional: Can post without linking a project

class ForumPostCreate(ForumPostBase):
    author_id: int # Required to link the post to a User

class ForumPostResponse(ForumPostBase):
    id: int
    author_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)