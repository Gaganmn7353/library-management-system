from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6)
    role: str = Field(default="member")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int = 1


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str]
    author: Optional[str]
    isbn: Optional[str]
    total_copies: Optional[int]


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int
    created_at: datetime

    class Config:
        orm_mode = True


class IssueRequest(BaseModel):
    user_id: int
    book_id: int
    days: int = 14


class ReturnRequest(BaseModel):
    transaction_id: int


class TransactionOut(BaseModel):
    id: int
    user_id: int
    book_id: int
    issued_at: datetime
    due_at: datetime
    returned_at: Optional[datetime]
    fine_collected: int

    class Config:
        orm_mode = True


class TransactionDetailsOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    book_id: int
    book_title: str
    issued_at: datetime
    due_at: datetime
    returned_at: Optional[datetime]
    fine_collected: int


