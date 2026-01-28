from src.database import get_db

class BaseService:
    def execute_with_db(self, func):
        with get_db() as db:
            return func(db)