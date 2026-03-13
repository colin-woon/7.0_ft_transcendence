import logging
import os
from typing import List
from fastapi import APIRouter, FastAPI, Depends, status, Query
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from src.database import engine, Base, get_db, SessionLocal
from src import schemas, logic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forum_service")


def _is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def maybe_seed_projects() -> None:
    if not _is_truthy(os.getenv("SEED_PROJECTS")):
        logger.info("Project seeding disabled (SEED_PROJECTS is false/missing).")
        return

    seed_file = os.getenv("SEED_PROJECTS_FILE", "data/response.json")

    db = SessionLocal()
    try:
        result = logic.seed_projects_from_json(db, seed_file)
        logger.info(
            "Project seeding completed. created=%s skipped=%s",
            result["created"],
            result["skipped"],
        )
    except Exception:
        logger.exception("Project seeding failed.")
        raise
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    maybe_seed_projects()
    logger.info("Forum Service is live.")
    yield

app = FastAPI(title="Forum Service API", lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok"}

# Mock User ID (Replace with real Auth later)
def get_current_user_id():
    return 1

# --- ROUTES ---

router = APIRouter(prefix="/forum")

@router.get("/projects", response_model=schemas.ProjectListPage)
def list_projects(    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), db: Session = Depends(get_db),):
    return logic.get_all_projects_paginated(db, page=page, page_size=page_size)


@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    return logic.get_project_by_id(db, project_id)


@router.post("/projects", response_model=schemas.ProjectResponse, status_code=201)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return logic.create_project(db, project)

@router.get("/projects/{project_id}/posts", response_model=List[schemas.PostSummary])
def list_project_posts(project_id: int, db: Session = Depends(get_db)):
    return logic.get_posts_by_project(db, project_id)

@router.post("/projects/{project_id}/posts", response_model=schemas.PostDetail, status_code=201)
def create_post(
    project_id: int, 
    post: schemas.PostCreate, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return logic.create_post(db, project_id, user_id, post)

@router.get("/posts/{post_id}", response_model=schemas.PostDetail)
def get_post(post_id: int, db: Session = Depends(get_db)):
    return logic.get_post_detail(db, post_id)

@router.get("/posts/{post_id}/comments", response_model=List[schemas.CommentResponse])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    return logic.get_comments_by_post(db, post_id)

@router.post("/posts/{post_id}/comments", response_model=schemas.CommentResponse, status_code=201)
def create_comment(
    post_id: int, 
    comment: schemas.CommentCreate, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return logic.create_comment(db, post_id, user_id, comment)

@router.post("/posts/{post_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_post(
    post_id: int,
    action: schemas.VoteAction,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return logic.cast_post_vote(db, post_id, user_id, action.vote_value)

app.include_router(router)