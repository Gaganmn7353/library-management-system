# API Documentation

## Overview

The Library Management System API provides comprehensive endpoints for managing books, members, transactions, reservations, fines, and analytics.

**Base URL**: `http://localhost:5000/api`

**API Documentation**: `http://localhost:5000/api-docs` (Swagger UI)

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

### Getting a Token

1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use the returned token in the `Authorization` header: `Bearer <token>`

### Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/books
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Endpoints

### Authentication

#### Register User
- **POST** `/auth/register`
- **Public**: Yes
- **Body**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Test@1234",
    "role": "member"
  }
  ```
- **Response**: User object and JWT token

#### Login
- **POST** `/auth/login`
- **Public**: Yes
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Test@1234"
  }
  ```
- **Response**: User object and JWT token

#### Get Current User
- **GET** `/auth/me`
- **Auth**: Required
- **Response**: Current user profile

#### Logout
- **POST** `/auth/logout`
- **Auth**: Required
- **Response**: Success message

### Books

#### Get All Books
- **GET** `/books`
- **Public**: Yes
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `search` - Search term
  - `category` - Filter by category
  - `sortBy` - Sort field (title, author, publication_year)
  - `sortOrder` - ASC or DESC
- **Response**: Array of books with pagination

#### Get Book by ID
- **GET** `/books/:id`
- **Public**: Yes
- **Response**: Book object

#### Search Books
- **GET** `/books/search?q=query`
- **Public**: Yes
- **Response**: Array of matching books

#### Get Books by Category
- **GET** `/books/category/:category`
- **Public**: Yes
- **Response**: Array of books in category

#### Create Book
- **POST** `/books`
- **Auth**: Librarian/Admin
- **Body**:
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "publisher": "Scribner",
    "publication_year": 1925,
    "category": "Fiction",
    "quantity": 10,
    "available_quantity": 10,
    "description": "A classic American novel"
  }
  ```
- **Response**: Created book object

#### Update Book
- **PUT** `/books/:id`
- **Auth**: Librarian/Admin
- **Body**: Partial book data
- **Response**: Updated book object

#### Delete Book
- **DELETE** `/books/:id`
- **Auth**: Admin only
- **Response**: Success message

#### Update Book Quantity
- **PATCH** `/books/:id/quantity`
- **Auth**: Librarian/Admin
- **Body**:
  ```json
  {
    "available_quantity": 5
  }
  ```
- **Response**: Updated book object

### Transactions

#### Issue Book
- **POST** `/transactions/issue`
- **Auth**: Librarian/Admin
- **Body**:
  ```json
  {
    "member_id": 1,
    "book_id": 1
  }
  ```
- **Response**: Transaction object

#### Return Book
- **POST** `/transactions/:id/return`
- **Auth**: Librarian/Admin
- **Body**:
  ```json
  {
    "return_date": "2023-11-15"
  }
  ```
- **Response**: Updated transaction object

#### Get All Transactions
- **GET** `/transactions`
- **Auth**: Librarian/Admin
- **Query Parameters**: `page`, `limit`, `status`, `member_id`
- **Response**: Array of transactions

#### Get Member Transactions
- **GET** `/transactions/member/:memberId`
- **Auth**: Member (own) or Librarian/Admin
- **Response**: Array of member's transactions

#### Get Overdue Transactions
- **GET** `/transactions/overdue`
- **Auth**: Librarian/Admin
- **Response**: Array of overdue transactions

#### Calculate Fine
- **PATCH** `/transactions/:id/calculate-fine`
- **Auth**: Librarian/Admin
- **Response**: Transaction with calculated fine

### Reservations

#### Create Reservation
- **POST** `/reservations`
- **Auth**: Member
- **Body**:
  ```json
  {
    "book_id": 1
  }
  ```
- **Response**: Reservation object

#### Get Member Reservations
- **GET** `/reservations/member/:memberId`
- **Auth**: Member (own) or Librarian/Admin
- **Response**: Array of reservations

#### Fulfill Reservation
- **PATCH** `/reservations/:id/fulfill`
- **Auth**: Librarian/Admin
- **Response**: Updated reservation object

#### Cancel Reservation
- **DELETE** `/reservations/:id`
- **Auth**: Member (own) or Librarian/Admin
- **Response**: Success message

### Fines

#### Get Member Fines
- **GET** `/fines/member/:memberId`
- **Auth**: Member (own) or Librarian/Admin
- **Response**: Fine summary with transactions

#### Pay Fine
- **POST** `/fines/pay`
- **Auth**: Member
- **Body**:
  ```json
  {
    "transaction_id": 1,
    "amount": 25.0,
    "payment_method": "cash"
  }
  ```
- **Response**: Payment object

#### Get Fine History
- **GET** `/fines/history/:memberId`
- **Auth**: Member (own) or Librarian/Admin
- **Response**: Array of payment history

### Dashboard (Admin Only)

#### Get Overall Stats
- **GET** `/dashboard/stats`
- **Auth**: Admin
- **Response**: Overall statistics

#### Get Popular Books
- **GET** `/dashboard/popular-books?limit=10`
- **Auth**: Admin
- **Response**: Array of popular books

#### Get Active Members
- **GET** `/dashboard/active-members?limit=10`
- **Auth**: Admin
- **Response**: Array of active members

#### Get Revenue Stats
- **GET** `/dashboard/revenue`
- **Auth**: Admin
- **Response**: Revenue statistics

### Reports (Admin Only)

#### Get Circulation Report
- **GET** `/reports/circulation?start_date=2023-01-01&end_date=2023-12-31`
- **Auth**: Admin
- **Query Parameters**: `start_date`, `end_date`, `export` (csv)
- **Response**: Circulation report data or CSV file

#### Get Overdue Report
- **GET** `/reports/overdue`
- **Auth**: Admin
- **Response**: Overdue report data

#### Get Inventory Report
- **GET** `/reports/inventory`
- **Auth**: Admin
- **Response**: Inventory report data

#### Get Membership Report
- **GET** `/reports/members`
- **Auth**: Admin
- **Response**: Membership report data

## Error Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes
- **Register endpoint**: 3 requests per hour
- **General endpoints**: 100 requests per 15 minutes

## Postman Collection

Import the `postman_collection.json` file into Postman for easy API testing.

## Swagger Documentation

Access interactive API documentation at:
- **URL**: `http://localhost:5000/api-docs`
- **Features**:
  - Try out endpoints directly
  - View request/response schemas
  - See authentication requirements
  - Test with different user roles

## Examples

### Complete Workflow: Issue and Return Book

```bash
# 1. Login as librarian
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"librarian@example.com","password":"password"}'

# 2. Issue book (use token from step 1)
curl -X POST http://localhost:5000/api/transactions/issue \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"member_id":1,"book_id":1}'

# 3. Return book
curl -X POST http://localhost:5000/api/transactions/1/return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"return_date":"2023-11-15"}'
```

### Search and Filter Books

```bash
# Search books
curl "http://localhost:5000/api/books/search?q=gatsby"

# Filter by category
curl "http://localhost:5000/api/books?category=Fiction&page=1&limit=10"

# Sort by publication year
curl "http://localhost:5000/api/books?sortBy=publication_year&sortOrder=DESC"
```

## Support

For issues or questions, please refer to:
- API Documentation: `/api-docs`
- Testing Documentation: `TESTING_DOCUMENTATION.md`
- Implementation Summaries in project root

