import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 'postgresql+psycopg db api', need to install through uv
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg://dev_user:dev_password@localhost:5433/forum_db"
)

engine = create_engine(DATABASE_URL, echo=False) # echo=True prints SQL to terminal for debugging

# use this to generate new sessions for your API routes or scripts
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# declarative base
# all models in models.py will inherit from this
Base = declarative_base()

# Helper function to get a DB session (Dependency Injection pattern)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()