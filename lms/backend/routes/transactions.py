from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Book, Transaction, User
from ..utils import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])

FINE_PER_DAY = 10  # in currency units (e.g., INR/USD) per overdue day


@router.post("/issue")
def issue_book(req: schemas.IssueRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == req.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="No copies available")
    due_at = datetime.utcnow() + timedelta(days=req.days)
    trx = Transaction(user_id=req.user_id, book_id=req.book_id, due_at=due_at)
    book.available_copies -= 1
    db.add(trx)
    db.commit()
    db.refresh(trx)
    return {"detail": "Issued", "transaction_id": trx.id}


@router.post("/return")
def return_book(req: schemas.ReturnRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    trx = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
    if not trx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if trx.returned_at is not None:
        raise HTTPException(status_code=400, detail="Book already returned")
    now = datetime.utcnow()
    trx.returned_at = now
    overdue_days = max(0, (now.date() - trx.due_at.date()).days)
    fine = overdue_days * FINE_PER_DAY
    trx.fine_collected = fine

    book = db.query(Book).filter(Book.id == trx.book_id).first()
    if book:
        book.available_copies = min(book.total_copies, book.available_copies + 1)
    db.commit()
    db.refresh(trx)
    return {"detail": "Returned", "fine": fine, "transaction": trx}


@router.get("/my", response_model=list[schemas.TransactionOut])
def my_transactions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    trxs = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.issued_at.desc()).all()
    return trxs


@router.get("", response_model=list[schemas.TransactionDetailsOut])
def list_transactions(db: Session = Depends(get_db)):
    # join to include names and titles
    results = (
        db.query(
            Transaction.id,
            Transaction.user_id,
            User.name.label("user_name"),
            Transaction.book_id,
            Book.title.label("book_title"),
            Transaction.issued_at,
            Transaction.due_at,
            Transaction.returned_at,
            Transaction.fine_collected,
        )
        .join(User, User.id == Transaction.user_id)
        .join(Book, Book.id == Transaction.book_id)
        .order_by(Transaction.issued_at.desc())
        .all()
    )
    # convert Row objects to dicts matching schema
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "user_name": r.user_name,
            "book_id": r.book_id,
            "book_title": r.book_title,
            "issued_at": r.issued_at,
            "due_at": r.due_at,
            "returned_at": r.returned_at,
            "fine_collected": r.fine_collected,
        }
        for r in results
    ]


