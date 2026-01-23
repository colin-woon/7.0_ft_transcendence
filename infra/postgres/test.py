# TLDR: A simple script to verify Python -> SQLAlchemy -> Docker Postgres connection.
import os
from sqlalchemy.orm import Session

# Import your shared infrastructure
# Note: Ensure you are running this from a directory where 'src' is accessible
from src.database import engine, Base, SessionLocal
from src.models import User

def test_connection():
    print("--- 1. Initializing Tables ---")
    # This creates the tables defined in models.py if they aren't there
    Base.metadata.create_all(bind=engine)
    
    print("--- 2. Starting Session ---")
    # Use a context manager to ensure the session closes automatically
    with SessionLocal() as session:
        try:
            print("--- 3. Creating Test User ---")
            test_user = User(
                full_name="Bum Engineer",
                email="hello@example.com"
            )
            
            # Check if user already exists to avoid Unique Constraint errors
            existing = session.query(User).filter(User.email == test_user.email).first()
            if not existing:
                session.add(test_user)
                session.commit()
                print(f"✅ Success! User '{test_user.full_name}' added to Docker DB.")
            else:
                print("ℹ️ User already exists in DB. Connection is healthy.")

        except Exception as e:
            print(f"❌ Error during DB interaction: {e}")
            session.rollback()

def query_users():
    # 1. Open the session
    with SessionLocal() as db:
        print("--- Fetching All Users ---")
        # Query all records from the 'users' table
        users = db.query(User).all()
        
        for user in users:
            # Accessing properties defined in your models.py
            print(f"ID: {user.id} | Name: {user.full_name} | Email: {user.email}")

        print("\n--- Finding a Specific User by Email ---")
        # .filter() acts like a SQL WHERE clause
        target_email = "test@example.com"
        single_user = db.query(User).filter(User.email == target_email).first()
        
        if single_user:
            print(f"Found: {single_user.full_name} (Joined: {single_user.created_at})")
        else:
            print("User not found.")

if __name__ == "__main__":
    query_users()

if __name__ == "__main__":
    test_connection()
    query_users()