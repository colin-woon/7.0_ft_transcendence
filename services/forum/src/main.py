import logging
from typing import List
from fastapi import FastAPI, HTTPException, status
from contextlib import asynccontextmanager

from src.database import engine, Base
from src.models import Project, ForumPost
from src.base_service import BaseService
from src.schemas import (
    ProjectCreate, ProjectResponse, 
    ForumPostCreate, ForumPostResponse
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forum_service")

# --- Service Layer ---

class ProjectService(BaseService):
    def get_all(self) -> List[Project]:
        return self.execute_with_db(lambda db: db.query(Project).all())

    def create(self, data: ProjectCreate) -> Project:
        def action(db):
            new_obj = Project(**data.model_dump())
            db.add(new_obj)
            db.commit()
            db.refresh(new_obj)
            return new_obj
        return self.execute_with_db(action)

class PostService(BaseService):
    def get_by_project(self, proj_id: int) -> List[ForumPost]:
        return self.execute_with_db(
            lambda db: db.query(ForumPost).filter(ForumPost.project_id == proj_id).all()
        )

    def create(self, data: ForumPostCreate) -> ForumPost:
        def action(db):
            # Note: We no longer check if user exists in DB (because they are in a diff service)
            # In a real app, you would verify the JWT token here to ensure author_id is valid.
            new_post = ForumPost(**data.model_dump())
            db.add(new_post)
            db.commit()
            db.refresh(new_post)
            return new_post
        return self.execute_with_db(action)

project_svc = ProjectService()
post_svc = PostService()

# --- Lifespan ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connecting to Forum Database...")
    # This creates tables inside the 'forum_service' schema if they don't exist
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Forum Service is live.")
    yield

app = FastAPI(title="Forum Service API", lifespan=lifespan)

# --- API Routes ---

@app.get("/projects", response_model=List[ProjectResponse])
def read_projects():
    return project_svc.get_all()

@app.post("/projects", response_model=ProjectResponse, status_code=201)
def create_project(project: ProjectCreate):
    return project_svc.create(project)

@app.post("/posts", response_model=ForumPostResponse, status_code=201)
def create_post(post: ForumPostCreate):
    return post_svc.create(post)

@app.get("/projects/{project_id}/posts", response_model=List[ForumPostResponse])
def read_project_posts(project_id: int):
    return post_svc.get_by_project(project_id)