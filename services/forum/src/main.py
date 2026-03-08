import logging
from typing import List
from fastapi import FastAPI, Depends, status
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from src.database import engine, Base, get_db
from src import schemas, logic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forum_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This will create tables (and ignore existing ones)
    # Since you removed tables, you might need to DROP the old ones manually 
    # or just delete the DB volume to be clean.
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Forum Service is live.")
    yield

app = FastAPI(title="Forum Service API", lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok"}

# Mock User ID (Replace with real Auth later)
def get_current_user_id():
    return 1

# --- ROUTES ---

@app.get("/projects", response_model=List[schemas.ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return logic.get_all_projects(db)

@app.post("/projects", response_model=schemas.ProjectResponse, status_code=201)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return logic.create_project(db, project)

@app.get("/projects/{project_id}/posts", response_model=List[schemas.PostSummary])
def list_project_posts(project_id: int, db: Session = Depends(get_db)):
    return logic.get_posts_by_project(db, project_id)

@app.post("/projects/{project_id}/posts", response_model=schemas.PostDetail, status_code=201)
def create_post(
    project_id: int, 
    post: schemas.PostCreate, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return logic.create_post(db, project_id, user_id, post)

@app.get("/posts/{post_id}", response_model=schemas.PostDetail)
def get_post(post_id: int, db: Session = Depends(get_db)):
    return logic.get_post_detail(db, post_id)

@app.get("/posts/{post_id}/comments", response_model=List[schemas.CommentResponse])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    return logic.get_comments_by_post(db, post_id)

@app.post("/posts/{post_id}/comments", response_model=schemas.CommentResponse, status_code=201)
def create_comment(
    post_id: int, 
    comment: schemas.CommentCreate, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return logic.create_comment(db, post_id, user_id, comment)