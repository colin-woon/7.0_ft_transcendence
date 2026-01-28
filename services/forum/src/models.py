from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

# import the base created in your shared infra
from src.database import Base

class Project(Base):
    __tablename__ = "projects"
    # Tells SQLAlchemy to look in the 'forum_service' schema, not public
    __table_args__ = {"schema": "forum_service"} 

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

class ForumPost(Base):
    __tablename__ = "forum_posts"
    __table_args__ = {"schema": "forum_service"}

    id: Mapped[int] = mapped_column(primary_key=True)
    
    # LOOSE REFERENCE! the Forum DB doesn't know the Users table exists.
    author_id: Mapped[int] = mapped_column() 
    
    project_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("forum_service.projects.id", ondelete="SET NULL")
    )
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    project: Mapped["Project"] = relationship()