from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Projects ---


class ProjectSummary(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(BaseModel):
    slug: str
    name: str
    objectives: List[str] = []
    solo: bool = True
    estimate_time: Optional[str] = None
    difficulty: Optional[str] = None
    xp: int = 0
    description: Optional[str] = None
    post_count: int = 0


class ProjectUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    objectives: Optional[List[str]] = None
    solo: Optional[bool] = None
    estimate_time: Optional[str] = None
    difficulty: Optional[str] = None
    xp: Optional[int] = None
    description: Optional[str] = None


class ProjectResponse(ProjectCreate):
    id: int
    created_at: datetime
    subscriber_count: int = 0

    class Config:
        from_attributes = True


class ProjectListPage(BaseModel):
    items: List[ProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProjectSubscriptionResponse(BaseModel):
    project_id: int
    user_id: int
    subscribed_at: datetime

    class Config:
        from_attributes = True


class ActionResponse(BaseModel):
    message: str


class ProjectSubscriptionStatusResponse(BaseModel):
    project_id: int
    subscribed: bool


class ProjectSubscriberCountResponse(BaseModel):
    project_id: int
    subscriber_count: int


# --- POSTS ---
class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=10000)


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1, max_length=10000)


class PostSummary(BaseModel):
    id: int
    project_id: int
    author_id: int
    title: str
    view_count: int
    created_at: datetime
    vote_score: int = 0
    user_vote: int = 0
    comment_count: int = 0

    class Config:
        from_attributes = True


class PostDetail(PostSummary):
    content: str


# --- Comments ---
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)


class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=10000)


class CommentResponse(BaseModel):
    id: int
    post_id: int
    author_id: int
    content: str
    is_best_answer: bool = False
    vote_score: int = 0
    user_vote: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class VoteAction(BaseModel):
    vote_value: int
