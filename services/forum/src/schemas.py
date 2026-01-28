from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    slug: str
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
    project_id: Optional[int] = None

class ForumPostCreate(ForumPostBase):
    author_id: int 

class ForumPostResponse(ForumPostBase):
    id: int
    author_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)