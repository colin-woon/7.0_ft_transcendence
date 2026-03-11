from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List
from sqlalchemy.exc import IntegrityError

from src import models, schemas

# --- PROJECTS ---

def get_all_projects(db: Session) -> List[models.Project]:
    return db.query(models.Project).all()

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

def get_posts_by_project(db: Session, project_id: int) -> List[models.ForumPost]:
    # Simple fetch, no counting
    return db.query(models.ForumPost).filter(models.ForumPost.project_id == project_id).all()

def create_post(db: Session, project_id: int, user_id: int, data: schemas.PostCreate) -> models.ForumPost:
    if not db.query(models.Project).filter(models.Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")

    new_post = models.ForumPost(
        project_id=project_id,
        author_id=user_id,
        title=data.title,
        content=data.content
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

def get_post_detail(db: Session, post_id: int) -> models.ForumPost:
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment View Count
    post.view_count += 1
    db.commit()
    db.refresh(post) # Refresh to get updated view count
    return post

# --- COMMENTS ---

def get_comments_by_post(db: Session, post_id: int) -> List[models.Comment]:
    return db.query(models.Comment).filter(models.Comment.post_id == post_id).all()

def create_comment(db: Session, post_id: int, user_id: int, data: schemas.CommentCreate) -> models.Comment:
    if not db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first():
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = models.Comment(
        post_id=post_id,
        author_id=user_id,
        content=data.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

# --- UPVOTES ---
# --- VOTING ---

def cast_post_vote(db: Session, post_id: int, user_id: int, vote_value: int) -> dict:
    # 1. Validate the vote value matches your SQL CHECK constraint
    if vote_value not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote value must be 1 or -1")

    # 2. Ensure the post exists
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # 3. Check if the user has already voted on this specific post
    existing_vote = db.query(models.PostVote).filter(
        models.PostVote.post_id == post_id,
        models.PostVote.user_id == user_id
    ).first()

    if existing_vote:
        if existing_vote.vote_value == vote_value:
            # TOGGLE OFF: User clicked the same vote button again. Delete the vote.
            db.delete(existing_vote)
            db.commit()
            return {"message": "Vote removed"}
        else:
            # CHANGE VOTE: User switched from upvote to downvote (or vice versa).
            existing_vote.vote_value = vote_value
            db.commit()
            return {"message": "Vote updated"}
    else:
        # NEW VOTE: Insert the record.
        new_vote = models.PostVote(
            post_id=post_id, 
            user_id=user_id, 
            vote_value=vote_value
        )
        db.add(new_vote)
        db.commit()
        return {"message": "Vote registered"}