from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Projects ---
class ProjectCreate(BaseModel):
    slug: str
    name: str
    objectives: List[str] = []
    estimate_time: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(ProjectCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ProjectListPage(BaseModel):
    items: List[ProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# --- POSTS ---
class PostCreate(BaseModel):
    title: str
    content: str

class PostSummary(BaseModel):
    id: int
    project_id: int
    author_id: int
    title: str
    view_count: int
    created_at: datetime
    class Config:
        from_attributes = True

class PostDetail(PostSummary):
    content: str
    
# --- Comments ---
class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    post_id: int 
    author_id: int
    content: str
    is_best_answer: bool = False
    created_at: datetime
    class Config:
        from_attributes = True

class VoteAction(BaseModel):
    vote_value: int

