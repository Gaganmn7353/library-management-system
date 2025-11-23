from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Book
from ..utils import require_role

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/", response_model=list[schemas.BookOut])
def list_books(q: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Book)
    if q:
        like = f"%{q}%"
        query = query.filter((Book.title.ilike(like)) | (Book.author.ilike(like)) | (Book.isbn.ilike(like)))
    return query.order_by(Book.created_at.desc()).all()


@router.post("/add", response_model=schemas.BookOut, dependencies=[Depends(require_role("librarian"))])
def add_book(book_in: schemas.BookCreate, db: Session = Depends(get_db)):
    exists = db.query(Book).filter(Book.isbn == book_in.isbn).first()
    if exists:
        raise HTTPException(status_code=400, detail="Book with this ISBN already exists")
    book = Book(
        title=book_in.title,
        author=book_in.author,
        isbn=book_in.isbn,
        total_copies=book_in.total_copies,
        available_copies=book_in.total_copies,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.put("/{book_id}", response_model=schemas.BookOut, dependencies=[Depends(require_role("librarian"))])
def update_book(book_id: int, book_in: schemas.BookUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book_in.title is not None:
        book.title = book_in.title
    if book_in.author is not None:
        book.author = book_in.author
    if book_in.isbn is not None:
        # ensure uniqueness
        exists = db.query(Book).filter(Book.isbn == book_in.isbn, Book.id != book_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="ISBN already used by another book")
        book.isbn = book_in.isbn
    if book_in.total_copies is not None:
        diff = book_in.total_copies - book.total_copies
        # adjust available based on new total but never below 0
        book.total_copies = book_in.total_copies
        book.available_copies = max(0, book.available_copies + diff)
    db.commit()
    db.refresh(book)
    return book


@router.delete("/{book_id}", dependencies=[Depends(require_role("librarian"))])
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies != book.total_copies:
        raise HTTPException(status_code=400, detail="Cannot delete: some copies are issued")
    db.delete(book)
    db.commit()
    return {"detail": "Deleted"}


