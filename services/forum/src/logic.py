from sqlalchemy.orm import Session
from sqlalchemy import func, text
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from src import models, schemas
from pathlib import Path
from typing import List, Any
import json


# --- SEEDING FUNCS---
def load_seed_json(json_path: str | Path) -> list[dict[str, Any]]:
    path_obj = Path(json_path)
    if not path_obj.exists() or not path_obj.is_file():
        raise ValueError(f"Seed file not found or invalid path: {path_obj}")
    try:
        with path_obj.open("r", encoding="utf-8") as seed_data:
            data = json.load(seed_data)

    except json.JSONDecodeError as exc:
        raise ValueError(f"Seed file has invalid JSON: {path_obj}") from exc

    if not isinstance(data, list):
        raise ValueError("Seed JSON must be a list of objects")

    for i, row in enumerate(data):
        if not isinstance(row, dict):
            raise ValueError(f"Seed row at index {i} is not an object")

    return data

def seed_projects_from_json(db: Session, json_path: str | Path) -> dict[str, int]:
    rows = load_seed_json(json_path)
    created = 0
    skipped = 0

    try:
        for obj in rows:
            slug = obj.get("slug")
            name = obj.get("name")
            difficulty = obj.get("difficulty")

            if not slug or not name:
                skipped += 1
                continue

            existing_project = db.query(models.Project).filter(models.Project.slug == slug).first()
            if existing_project:
                skipped += 1
                continue

            sessions = obj.get("project_sessions") or []
            first_session = sessions[0] if sessions else {}

            new_project = models.Project(
                slug=slug,
                name=name,
                difficulty = difficulty,
                description=first_session.get("description"),
                solo=first_session.get("solo"),
                objectives=first_session.get("objectives") or [],
                estimate_time=first_session.get("estimate_time"),
            )
            db.add(new_project)
            created += 1

        db.commit()
        return {"created": created, "skipped": skipped}
    except Exception:
        db.rollback()
        raise

def backfill_forum_counters(db: Session) -> dict[str, int]:
    project_counts = dict(
        db.query(models.ForumPost.project_id, func.count(models.ForumPost.id))
        .filter(models.ForumPost.project_id.isnot(None))
        .group_by(models.ForumPost.project_id)
        .all()
    )

    post_comment_counts = dict(
        db.query(models.Comment.post_id, func.count(models.Comment.id))
        .group_by(models.Comment.post_id)
        .all()
    )

    projects = db.query(models.Project).all()
    posts = db.query(models.ForumPost).all()

    for p in projects:
        p.post_count = project_counts.get(p.id, 0)

    for post in posts:
        post.comment_count = post_comment_counts.get(post.id, 0)

    db.commit()
    return {"projects_updated": len(projects), "posts_updated": len(posts)}


# --- HELPER COUNT FUNCTIONS ---
def get_project_post_count(db: Session, project_id: int) -> int:
    count = db.query(func.count(models.ForumPost.id))\
              .filter(models.ForumPost.project_id == project_id)\
              .scalar()
    return count or 0

def get_post_comment_count(db: Session, post_id: int) -> int:
    count = db.query(func.count(models.Comment.id))\
              .filter(models.Comment.post_id == post_id)\
              .scalar()
    return count or 0


# --- PROJECTS ---
def get_all_projects(db: Session) -> List[models.Project]:
    return db.query(models.Project).all()

def get_all_projects_paginated(db: Session, page: int, page_size: int) -> dict:
    offset = (page - 1) * page_size
    total = db.query(models.Project).count()
    results = (
        db.query(
            models.Project,
            (
                models.Project.post_count + 
                func.coalesce(func.sum(models.ForumPost.comment_count), 0)
            ).label("hot_score")
        )
        .outerjoin(models.ForumPost, models.Project.id == models.ForumPost.project_id)
        .group_by(models.Project.id)
        .order_by(text("hot_score DESC"), models.Project.id.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    
    #unpack tuple to get project list with list comprehension
    items = [project for project, hot_score in results]

    total_pages = (total + page_size - 1) // page_size
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

def get_project_by_id(db: Session, project_id: int) -> models.Project:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.post_count = get_project_post_count(db, project_id)
    return project


def create_project(db: Session, data: schemas.ProjectCreate) -> models.Project:
    new_project = models.Project(**data.model_dump())
    db.add(new_project)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Project slug already exists")
    db.refresh(new_project)
    return new_project



# --- POSTS ---
def get_all_posts(db:Session) -> List[models.ForumPost]:
    results = (
        db.query(
            models.ForumPost,
            func.coalesce(func.sum(models.PostVote.vote_value), 0).label("vote_score")
        )
        .outerjoin(models.PostVote, models.ForumPost.id == models.PostVote.post_id)
        .group_by(models.ForumPost.id)
        .all()
    )
    posts = []
    for post_obj, score in results:
        post_obj.vote_score = score
        posts.append(post_obj)
    return posts

def get_all_posts_sort_by_top(db:Session) -> List[models.ForumPost]:
    results = (
        db.query(
            models.ForumPost,
            func.coalesce(func.sum(models.PostVote.vote_value), 0).label("vote_score")
        )
        .outerjoin(models.PostVote, models.ForumPost.id == models.PostVote.post_id)
        .group_by(models.ForumPost.id)
        .order_by(text("vote_score DESC"))
        .all()
    )
    posts = []
    for post_obj, score in results:
        post_obj.vote_score = score
        posts.append(post_obj)
    return posts

def get_all_posts_sort_by_new(db:Session) -> List[models.ForumPost]:
    results = (
        db.query(
            models.ForumPost,
            func.coalesce(func.sum(models.PostVote.vote_value), 0).label("vote_score")
        )
        .outerjoin(models.PostVote, models.ForumPost.id == models.PostVote.post_id)
        .group_by(models.ForumPost.id)
        .order_by(text("created_at DESC"))
        .all()
    )
    posts = []
    for post_obj, score in results:
        post_obj.vote_score = score
        posts.append(post_obj)
    return posts

def get_posts_by_project(db: Session, project_id: int) -> List[models.ForumPost]:
    results = (
        db.query(
            models.ForumPost,
            func.coalesce(func.sum(models.PostVote.vote_value), 0).label("vote_score")
        )
        .outerjoin(models.PostVote, models.ForumPost.id == models.PostVote.post_id)
        .filter(models.ForumPost.project_id == project_id)
        .group_by(models.ForumPost.id)
        .all()
    )
    posts = []
    for post_obj, score in results:
        post_obj.vote_score = score
        posts.append(post_obj)
    return posts

def get_posts_by_project_sort_by_top(db: Session, project_id: int) -> List[models.ForumPost]:
    results = (
        db.query(
            models.ForumPost,
            func.coalesce(func.sum(models.PostVote.vote_value), 0).label("vote_score")
        )
        .outerjoin(models.PostVote, models.ForumPost.id == models.PostVote.post_id)
        .filter(models.ForumPost.project_id == project_id)
        .group_by(models.ForumPost.id)
        .order_by(text("vote_score DESC"))
        .all()
    )
    posts = []
    for post_obj, score in results:
        post_obj.vote_score = score
        posts.append(post_obj)
    return posts

def get_posts_by_project_sort_by_new(db: Session, project_id: int) -> List[models.ForumPost]:
    results = (
        db.query(
            models.ForumPost,
            func.coalesce(func.sum(models.PostVote.vote_value), 0).label("vote_score")
        )
        .outerjoin(models.PostVote, models.ForumPost.id == models.PostVote.post_id)
        .filter(models.ForumPost.project_id == project_id)
        .group_by(models.ForumPost.id)
        .order_by(text("created_at DESC"))
        .all()
    )
    posts = []
    for post_obj, score in results:
        post_obj.vote_score = score
        posts.append(post_obj)
    return posts

def create_post(db: Session, project_id: int, user_id: int, data: schemas.PostCreate) -> models.ForumPost:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_post = models.ForumPost(
        project_id=project_id,
        author_id=user_id,
        title=data.title,
        content=data.content,
    )

    db.add(new_post)
    project.post_count += 1
    db.commit()
    db.refresh(new_post)
    return new_post


def get_post_detail(db: Session, post_id: int) -> models.ForumPost:
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    score = get_post_vote_score(db, post_id)
    post.vote_score = score
    post.view_count += 1
    db.commit()
    db.refresh(post)
    return post




# --- COMMENTS ---
def get_comments_by_post(db: Session, post_id: int) -> List[models.Comment]:
    results = (
            db.query(
                models.Comment,
                func.coalesce(func.sum(models.CommentVote.vote_value), 0).label("vote_score")
            )
            .outerjoin(models.CommentVote, models.Comment.id == models.CommentVote.comment_id)
            .filter(models.Comment.post_id == post_id)
            .group_by(models.Comment.id)
            .order_by(text("vote_score DESC"), models.Comment.created_at.asc(), models.Comment.id.asc())
            .all()
        )
    comments = []
    for comment_obj, score in results:
        comment_obj.vote_score = score
        comment_obj.is_best_answer = False
        comments.append(comment_obj)

    # Mark only one best answer when there is at least one positive-vote comment.
    if comments and int(comments[0].vote_score or 0) > 0:
        comments[0].is_best_answer = True

    return comments

def get_comments_by_post_sort_by_top(db: Session, post_id: int) -> List[models.Comment]:
    results = (
            db.query(
                models.Comment,
                func.coalesce(func.sum(models.CommentVote.vote_value), 0).label("vote_score")
            )
            .outerjoin(models.CommentVote, models.Comment.id == models.CommentVote.comment_id)
            .filter(models.Comment.post_id == post_id)
            .group_by(models.Comment.id)
            .order_by(text("vote_score DESC"), models.Comment.created_at.asc(), models.Comment.id.asc())
            .all()
        )
    comments = []
    for comment_obj, score in results:
        comment_obj.vote_score = score
        comment_obj.is_best_answer = False
        comments.append(comment_obj)

    # Top-sorted comments can use the first positive entry as best answer.
    if comments and int(comments[0].vote_score or 0) > 0:
        comments[0].is_best_answer = True

    return comments

def get_comments_by_post_sort_by_new(db: Session, post_id: int) -> List[models.Comment]:
    results = (
            db.query(
                models.Comment,
                func.coalesce(func.sum(models.CommentVote.vote_value), 0).label("vote_score")
            )
            .outerjoin(models.CommentVote, models.Comment.id == models.CommentVote.comment_id)
            .filter(models.Comment.post_id == post_id)
            .group_by(models.Comment.id)
            .order_by(text ("created_at DESC"))
            .all()
        )
    comments = []
    for comment_obj, score in results:
        comment_obj.vote_score = score
        comment_obj.is_best_answer = False
        comments.append(comment_obj)

    # Newest sort still exposes best answer by score for consistent UI badge behavior.
    if comments:
        best_comment = max(comments, key=lambda comment: int(comment.vote_score or 0))
        if int(best_comment.vote_score or 0) > 0:
            best_comment.is_best_answer = True

    return comments

def create_comment(db: Session, post_id: int, user_id: int, data: schemas.CommentCreate) -> models.Comment:
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = models.Comment(
        post_id=post_id,
        author_id=user_id,
        content=data.content,
    )
    db.add(new_comment)
    post.comment_count += 1
    db.commit()
    db.refresh(new_comment)
    return new_comment



# --- VOTING ---
def cast_post_vote(db: Session, post_id: int, user_id: int, vote_value: int) -> dict:
    if vote_value not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote value must be 1 or -1")

    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_vote = db.query(models.PostVote).filter(
        models.PostVote.post_id == post_id,
        models.PostVote.user_id == user_id,
    ).first()

    if existing_vote:
        if existing_vote.vote_value == vote_value:
            db.delete(existing_vote)
            db.commit()
            score = get_post_vote_score(db, post_id)
            return {"message": "Vote removed", "vote_score": score}

        existing_vote.vote_value = vote_value
        db.commit()
        score = get_post_vote_score(db, post_id)
        return {"message": "Vote updated", "vote_score": score}

    new_vote = models.PostVote(
        post_id=post_id,
        user_id=user_id,
        vote_value=vote_value,
    )
    db.add(new_vote)
    db.commit()
    score = get_post_vote_score(db, post_id)
    return {"message": "Vote registered", "vote_score": score}

def cast_comment_vote(db: Session, comment_id: int, user_id: int, vote_value: int) -> dict:
    if vote_value not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote value must be 1 or -1")

    post = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing_vote = db.query(models.CommentVote).filter(
        models.CommentVote.comment_id == comment_id,
        models.CommentVote.user_id == user_id,
    ).first()

    if existing_vote:
        if existing_vote.vote_value == vote_value:
            db.delete(existing_vote)
            db.commit()
            score = get_comment_vote_score(db, comment_id)
            return {"message": "Vote registered", "vote_score": score}

        existing_vote.vote_value = vote_value
        db.commit()
        score = get_comment_vote_score(db, comment_id)
        return {"message": "Vote registered", "vote_score": score}

    new_vote = models.CommentVote(
        comment_id=comment_id,
        user_id=user_id,
        vote_value=vote_value,
    )
    db.add(new_vote)
    db.commit()
    score = get_comment_vote_score(db, comment_id)
    return {"message": "Vote registered", "vote_score": score}

def get_post_vote_score(db: Session, post_id: int) -> int:
    score = db.query(func.sum(models.PostVote.vote_value))\
        .filter(models.PostVote.post_id == post_id).scalar()
    return int(score or 0)

def get_comment_vote_score(db: Session, id: int) -> int:
    score = db.query(func.sum(models.CommentVote.vote_value))\
        .filter(models.CommentVote.comment_id == id).scalar()
    return int(score or 0)



# --- SEARCH ---
def search_project(db: Session, query: str) -> list[models.Project]:
    return db.query(models.Project).filter(models.Project.name.ilike(f"%{query}%")).all()

def search_posts(db: Session, query: str) -> list[models.ForumPost]:
    return db.query(models.ForumPost).filter(models.ForumPost.title.ilike(f"%{query}%")).all()
