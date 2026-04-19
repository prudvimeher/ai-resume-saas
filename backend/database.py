import logging
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker


load_dotenv()


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    return database_url


DATABASE_URL = get_database_url()

logger = logging.getLogger(__name__)

engine = create_engine(
    DATABASE_URL,
    connect_args={"connect_timeout": 5},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    try:
        logger.info("Creating database tables if they do not exist")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables are ready")
    except SQLAlchemyError:
        logger.exception("Database initialization failed")
        raise


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
