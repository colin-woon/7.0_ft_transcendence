from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, ForeignKey, func, Integer, Boolean, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


# --- 1. PROJECTS ---
class Project(Base):
    __tablename__ = "projects"
    __table_args__ = {"schema": "forum_service"}

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    solo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    objectives: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text))
    estimate_time: Mapped[Optional[str]] = mapped_column(String(50))
    difficulty: Mapped[Optional[str]] = mapped_column(String(10))
    xp: Mapped[int] = mapped_column(Integer, default=0)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    posts: Mapped[List["ForumPost"]] = relationship(back_populates="project")
    subscriptions: Mapped[List["ProjectSubscription"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


# --- 2. FORUM POSTS ---
class ForumPost(Base):
    __tablename__ = "forum_posts"
    __table_args__ = {"schema": "forum_service"}

    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column()

    project_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("forum_service.projects.id", ondelete="SET NULL")
    )

    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="posts")
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="post", cascade="all, delete-orphan"
    )


# --- 3. COMMENTS ---
class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = {"schema": "forum_service"}

    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column()

    post_id: Mapped[int] = mapped_column(
        ForeignKey("forum_service.forum_posts.id", ondelete="CASCADE")
    )

    content: Mapped[str] = mapped_column(Text)
    is_best_answer: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    post: Mapped["ForumPost"] = relationship(back_populates="comments")


class PostVote(Base):
    __tablename__ = "post_votes"
    __table_args__ = {"schema": "forum_service"}

    # composite primary key naturally prevents a user from voting twice
    post_id: Mapped[int] = mapped_column(
        ForeignKey("forum_service.forum_posts.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(primary_key=True)

    # will store 1 for upvote, -1 for downvote
    vote_value: Mapped[int] = mapped_column(Integer)


class CommentVote(Base):
    __tablename__ = "comment_votes"
    __table_args__ = {"schema": "forum_service"}

    # composite primary key naturally prevents a user from voting twice
    comment_id: Mapped[int] = mapped_column(
        ForeignKey("forum_service.comments.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(primary_key=True)

    # will store 1 for upvote, -1 for downvote
    vote_value: Mapped[int] = mapped_column(Integer)


class ProjectSubscription(Base):
    __tablename__ = "project_subscriptions"
    __table_args__ = {"schema": "forum_service"}

    project_id: Mapped[int] = mapped_column(
        ForeignKey("forum_service.projects.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[int] = mapped_column(primary_key=True)
    subscribed_at: Mapped[datetime] = mapped_column(server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="subscriptions")
