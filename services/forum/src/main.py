import logging
import os
from typing import List
from fastapi import (
    APIRouter,
    FastAPI,
    Depends,
    status,
    Query,
    Header,
    HTTPException,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from src.database import engine, Base, get_db, SessionLocal
from src import schemas, logic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forum_service")

# --- USED FOR PROJECT SEEDING ---


def _is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true"}


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
    finally:
        db.close()


def backfill_post_comment_count() -> None:
    db = SessionLocal()
    logic.backfill_forum_counters(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    maybe_seed_projects()
    backfill_post_comment_count()
    logger.info("Forum Service is live.")
    yield


app = FastAPI(title="Forum Service API", lifespan=lifespan)


@app.exception_handler(HTTPException)
async def http_exception_logger(request: Request, exc: HTTPException):
    logger.warning(
        "HTTP_EXCEPTION method=%s path=%s status=%s detail=%s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail,
    )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/health")
def health():
    return {"status": "ok"}


def _parse_roles(raw_roles: str | None) -> set[str]:
    if not raw_roles:
        return set()
    return {role.strip().upper() for role in raw_roles.split(",") if role.strip()}


def get_request_identity(
    request: Request,
    x_intra_user_id: str | None = Header(default=None, alias="X-Intra-User-Id"),
    x_intra_user_roles: str | None = Header(default=None, alias="X-Intra-User-Roles"),
) -> tuple[int, bool]:
    logger.info("Incoming request headers: %s", dict(request.headers))
    logger.info("X-Intra-User-Id header value: %s", x_intra_user_id)
    logger.info("X-Intra-User-Roles header value: %s", x_intra_user_roles)

    if x_intra_user_id is None:
        logger.warning(
            "NON_GATEWAY_PATH_DETECTED: Missing X-Intra-User-Id. "
            "Likely direct forum-service call. method=%s path=%s client=%s host=%s",
            request.method,
            request.url.path,
            request.client.host if request.client else "unknown",
            request.headers.get("host", "unknown"),
        )
        raise HTTPException(
            status_code=401, detail="Missing X-Intra-User-Id header"
        )

    try:
        parsed_user_id = int(x_intra_user_id.strip())
        roles = _parse_roles(x_intra_user_roles)
        return parsed_user_id, "ADMIN" in roles
    except ValueError as exc:
        raise HTTPException(
            status_code=401, detail="Invalid X-Intra-User-Id header"
        ) from exc


# --- ROUTES ---

router = APIRouter(prefix="")

# --- PROJECTS API ENDPOINT ---


@router.get("/projects", response_model=schemas.ProjectListPage)
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return logic.get_all_projects_paginated(db, page=page, page_size=page_size)


@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    return logic.get_project_by_id(db, project_id)


@router.post("/projects", response_model=schemas.ProjectResponse, status_code=201)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    _, is_admin = identity
    logic.require_admin(is_admin)
    return logic.create_project(db, project)


@router.patch("/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    _, is_admin = identity
    logic.require_admin(is_admin)
    return logic.update_project(db, project_id, project)


@router.delete("/projects/{project_id}", response_model=schemas.ActionResponse)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    _, is_admin = identity
    logic.require_admin(is_admin)
    logic.delete_project(db, project_id)
    return {"message": "Project deleted"}


@router.post(
    "/projects/{project_id}/subscribe",
    response_model=schemas.ProjectSubscriptionResponse,
    status_code=201,
)
def subscribe_project(
    project_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    subscription, _ = logic.subscribe_to_project(db, project_id, user_id)
    return subscription


@router.delete(
    "/projects/{project_id}/subscribe", response_model=schemas.ActionResponse
)
def unsubscribe_project(
    project_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    was_removed = logic.unsubscribe_from_project(db, project_id, user_id)
    if was_removed:
        return {"message": "Unsubscribed"}
    return {"message": "Not subscribed"}


@router.get("/projects/me/subscriptions", response_model=List[schemas.ProjectResponse])
def list_my_subscriptions(
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_subscriptions_by_user(db, user_id)


@router.get(
    "/projects/{project_id}/subscription-status",
    response_model=schemas.ProjectSubscriptionStatusResponse,
)
def get_subscription_status(
    project_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    subscribed = logic.is_user_subscribed_to_project(db, project_id, user_id)
    return {"project_id": project_id, "subscribed": subscribed}


@router.get(
    "/projects/{project_id}/subscribers/count",
    response_model=schemas.ProjectSubscriberCountResponse,
)
def get_project_subscriber_count(
    project_id: int,
    db: Session = Depends(get_db),
):
    subscriber_count = logic.get_project_subscriber_count(db, project_id)
    return {"project_id": project_id, "subscriber_count": subscriber_count}


# --- FORUM POST API ENDPOINT ---


@router.get("/posts", response_model=List[schemas.PostSummary])
def list_all_posts(
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_all_posts(db, user_id)


@router.get("/posts/top", response_model=List[schemas.PostSummary])
def list_all_posts_by_top(
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_all_posts_sort_by_top(db, user_id)


@router.get("/posts/new", response_model=List[schemas.PostSummary])
def list_all_posts_by_new(
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_all_posts_sort_by_new(db, user_id)


@router.get("/projects/{project_id}/posts", response_model=List[schemas.PostSummary])
def list_project_posts(
    project_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_posts_by_project(db, project_id, user_id)


@router.get(
    "/projects/{project_id}/posts/top", response_model=List[schemas.PostSummary]
)
def list_project_posts_by_top(
    project_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_posts_by_project_sort_by_top(db, project_id, user_id)


@router.get(
    "/projects/{project_id}/posts/new", response_model=List[schemas.PostSummary]
)
def list_project_posts_by_new(
    project_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_posts_by_project_sort_by_new(db, project_id, user_id)


@router.post(
    "/projects/{project_id}/posts", response_model=schemas.PostDetail, status_code=201
)
def create_post(
    project_id: int,
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.create_post(db, project_id, user_id, post)


@router.patch("/posts/{post_id}", response_model=schemas.PostDetail)
def update_post(
    post_id: int,
    post: schemas.PostUpdate,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, is_admin = identity
    return logic.update_post(db, post_id, user_id, is_admin, post)


@router.delete("/posts/{post_id}", response_model=schemas.ActionResponse)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, is_admin = identity
    logic.delete_post(db, post_id, user_id, is_admin)
    return {"message": "Post deleted"}


@router.get("/posts/{post_id}", response_model=schemas.PostDetail)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_post_detail(db, post_id, user_id)


# --- COMMENTS API ENDPOINT ---


@router.get("/posts/{post_id}/comments", response_model=List[schemas.CommentResponse])
def list_comments(
    post_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_comments_by_post(db, post_id, user_id)


@router.get(
    "/posts/{post_id}/comments/top", response_model=List[schemas.CommentResponse]
)
def list_comments_sort_by_top(
    post_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_comments_by_post_sort_by_top(db, post_id, user_id)


@router.get(
    "/posts/{post_id}/comments/new", response_model=List[schemas.CommentResponse]
)
def list_comments_sort_by_new(
    post_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.get_comments_by_post_sort_by_new(db, post_id, user_id)


@router.post(
    "/posts/{post_id}/comments", response_model=schemas.CommentResponse, status_code=201
)
def create_comment(
    post_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.create_comment(db, post_id, user_id, comment)


@router.patch(
    "/posts/{post_id}/comments/{comment_id}", response_model=schemas.CommentResponse
)
def update_comment(
    post_id: int,
    comment_id: int,
    comment: schemas.CommentUpdate,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, is_admin = identity
    return logic.update_comment(db, post_id, comment_id, user_id, is_admin, comment)


@router.delete(
    "/posts/{post_id}/comments/{comment_id}", response_model=schemas.ActionResponse
)
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, is_admin = identity
    logic.delete_comment(db, post_id, comment_id, user_id, is_admin)
    return {"message": "Comment deleted"}


# --- VOTES API ENDPOINT ---


@router.post("/posts/{post_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_post(
    post_id: int,
    action: schemas.VoteAction,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.cast_post_vote(db, post_id, user_id, action.vote_value)


@router.post(
    "/posts/{post_id}/comments/{comment_id}/vote", status_code=status.HTTP_200_OK
)
def vote_on_comment(
    post_id: int,
    comment_id: int,
    action: schemas.VoteAction,
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.cast_comment_vote(db, comment_id, user_id, action.vote_value)


# --- SEARCH FEATURE ENDPOINT ---


@router.get("/search/projects", response_model=List[schemas.ProjectResponse])
def search_project(
    search_query: str = Query(..., min_length=2, max_length=20),
    db: Session = Depends(get_db),
):
    return logic.search_project(db, search_query)


@router.get("/search/posts", response_model=List[schemas.PostSummary])
def search_posts(
    search_query: str = Query(..., min_length=2, max_length=20),
    db: Session = Depends(get_db),
    identity: tuple[int, bool] = Depends(get_request_identity),
):
    user_id, _ = identity
    return logic.search_posts(db, search_query, user_id)


app.include_router(router)
