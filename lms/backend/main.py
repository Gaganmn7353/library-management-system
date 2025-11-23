from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .models import Book
from .routes import auth, books, transactions


def create_app() -> FastAPI:
    app = FastAPI(title="Library Management System")

    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(books.router)
    app.include_router(transactions.router)

    return app


# Create tables
Base.metadata.create_all(bind=engine)

app = create_app()


def seed_books():
    db = SessionLocal()
    try:
        count = db.query(Book).count()
        if count >= 50:
            return
        samples = []
        for i in range(1, 61):
            samples.append(Book(
                title=f"Sample Book {i}",
                author=f"Author {((i - 1) % 10) + 1}",
                isbn=f"978000000{i:03d}",
                total_copies=5,
                available_copies=5,
            ))
        db.bulk_save_objects(samples)
        db.commit()
    finally:
        db.close()


seed_books()


