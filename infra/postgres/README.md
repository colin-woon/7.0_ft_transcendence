# 0 -- Setup dependencies first before using bums!
	sqlalchemy = v2.0.46
		uv add sqlalchemy
	psycopg = 3.3.2
		uv add psycopg

# 1 -- Docker container for postgresql
	Setup with postgres:18.1-alpine image from dockerhub
	To access psql cli for whatever reason:
	sudo docker exec -it postgres_db psql -U dev_user -d forum_db

# How to interact with database
	always add this import in your files:

	from src.database import engine, Base, SessionLocal

	this initializes the sqlalchemy engine connection, the base model and session so you can interact with database using python
