# Book Circulation & Transaction Management API

Complete documentation for the book circulation system with transaction management in the Library Management System.

## Base URL
```
/api/transactions
```

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

- **Librarian/Admin Endpoints**: Require librarian or admin role
- **Member Endpoints**: Members can only access their own transactions

---

## API Endpoints

### 1. Issue Book to Member

Issue a book to a member with automatic due date calculation and business rule validation.

**Endpoint:** `POST /api/transactions/issue`

**Authentication:** Required (Librarian/Admin only)

**Request Body:**

```json
{
  "member_id": 1,
  "book_id": 5,
  "issue_date": "2024-01-15"  // Optional, defaults to today
}
```

**Business Rules:**
- ✅ Member must be active and membership must be valid
- ✅ Book must be available (available_quantity > 0)
- ✅ Member cannot have more than 3 books at a time
- ✅ Member cannot issue the same book twice
- ✅ Member cannot have pending fines > ₹500
- ✅ Due date is automatically calculated (14 days from issue date)

**Example Response (201):**

```json
{
  "success": true,
  "message": "Book issued successfully",
  "data": {
    "transaction": {
      "id": 25,
      "member_id": 1,
      "book_id": 5,
      "issue_date": "2024-01-15",
      "due_date": "2024-01-29",
      "return_date": null,
      "fine_amount": 0,
      "status": "issued"
    },
    "book": {
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald"
    },
    "member": {
      "name": "john_doe",
      "member_id": "MEM001"
    }
  }
}
```

**Error Responses:**

- `400`: Member is inactive/suspended, membership expired, book not available, max books reached, duplicate book, pending fines too high
- `404`: Member or book not found

**Notes:**
- Email confirmation is sent to member automatically (non-blocking)
- Database transaction ensures data consistency
- Book available_quantity is automatically decremented

---

### 2. Return Book

Return a book and calculate fines if overdue.

**Endpoint:** `POST /api/transactions/return/:id`

**Authentication:** Required (Librarian/Admin only)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Transaction ID |

**Request Body (optional):**

```json
{
  "return_date": "2024-01-30"  // Optional, defaults to today
}
```

**Example Response (200):**

```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "transaction": {
      "id": 25,
      "member_id": 1,
      "book_id": 5,
      "issue_date": "2024-01-15",
      "due_date": "2024-01-29",
      "return_date": "2024-01-30",
      "fine_amount": 5.00,
      "status": "returned"
    },
    "fine_amount": 5.00,
    "days_overdue": 1
  }
}
```

**Fine Calculation:**
- Fine rate: ₹5 per day
- Calculated from due date to return date
- No fine if returned on or before due date

**Error Responses:**

- `400`: Book already returned
- `404`: Transaction not found

**Notes:**
- Email confirmation is sent to member automatically (non-blocking)
- Book available_quantity is automatically incremented
- Fine is calculated and saved automatically

---

### 3. Get All Transactions

Get paginated list of all transactions with filters (Librarian/Admin only).

**Endpoint:** `GET /api/transactions`

**Authentication:** Required (Librarian/Admin only)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |
| `status` | string | No | Filter by status: `issued`, `returned`, `overdue` |
| `member_id` | integer | No | Filter by member ID |
| `book_id` | integer | No | Filter by book ID |
| `overdue` | boolean | No | Filter overdue transactions (`true`) |

**Example Request:**
```bash
GET /api/transactions?page=1&limit=20&status=issued
```

**Example Response (200):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": 25,
        "member_id": 1,
        "book_id": 5,
        "issue_date": "2024-01-15",
        "due_date": "2024-01-29",
        "return_date": null,
        "fine_amount": 0,
        "status": "issued",
        "member_id": "MEM001",
        "member_name": "john_doe",
        "book_title": "The Great Gatsby",
        "book_author": "F. Scott Fitzgerald",
        "book_isbn": "978-0-7432-7356-5"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 4. Get Member Transactions

Get transactions for a specific member. Members can only view their own transactions.

**Endpoint:** `GET /api/transactions/member/:memberId`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memberId` | integer | Yes | Member ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |
| `status` | string | No | Filter by status |

**Example Request:**
```bash
GET /api/transactions/member/1?status=issued
```

**Example Response (200):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": 25,
        "member_id": 1,
        "book_id": 5,
        "issue_date": "2024-01-15",
        "due_date": "2024-01-29",
        "return_date": null,
        "fine_amount": 0,
        "status": "issued",
        "book_title": "The Great Gatsby",
        "book_author": "F. Scott Fitzgerald",
        "book_isbn": "978-0-7432-7356-5",
        "book_cover": "https://example.com/cover.jpg",
        "days_overdue": 0,
        "is_overdue": false,
        "calculated_fine": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

**Error Responses:**

- `403`: Member trying to access another member's transactions

**Notes:**
- Active transactions include calculated overdue status and fine amounts
- Members can only view their own transactions

---

### 5. Get Overdue Transactions

Get list of all overdue transactions (Librarian/Admin only).

**Endpoint:** `GET /api/transactions/overdue`

**Authentication:** Required (Librarian/Admin only)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": 20,
        "member_id": 1,
        "book_id": 5,
        "issue_date": "2024-01-10",
        "due_date": "2024-01-24",
        "return_date": null,
        "fine_amount": 25.00,
        "status": "overdue",
        "member_id": "MEM001",
        "member_name": "john_doe",
        "book_title": "The Great Gatsby",
        "days_overdue": 5,
        "calculated_fine": 25.00
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Notes:**
- Automatically calculates days overdue and fine amounts
- Sorted by due date (oldest first)

---

### 6. Calculate Fine

Calculate and update fine for a specific transaction (Librarian/Admin only).

**Endpoint:** `PATCH /api/transactions/:id/calculate-fine`

**Authentication:** Required (Librarian/Admin only)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Transaction ID |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Fine calculated successfully",
  "data": {
    "transaction": {
      "id": 20,
      "status": "overdue",
      "fine_amount": 25.00,
      ...
    },
    "days_overdue": 5,
    "fine_amount": 25.00,
    "fine_rate_per_day": 5.00,
    "currency": "INR"
  }
}
```

**Error Responses:**

- `400`: Cannot calculate fine for returned book
- `404`: Transaction not found

**Notes:**
- Updates transaction status to 'overdue' if applicable
- Sends overdue notification email (non-blocking)
- Fine rate: ₹5 per day

---

### 7. Get Transaction by ID

Get detailed information about a specific transaction.

**Endpoint:** `GET /api/transactions/:id`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Transaction ID |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "id": 25,
    "member_id": 1,
    "book_id": 5,
    "issue_date": "2024-01-15",
    "due_date": "2024-01-29",
    "return_date": null,
    "fine_amount": 0,
    "status": "issued",
    "member_id": "MEM001",
    "member_name": "john_doe",
    "member_email": "john@example.com",
    "book_title": "The Great Gatsby",
    "book_author": "F. Scott Fitzgerald",
    "book_isbn": "978-0-7432-7356-5"
  }
}
```

---

## Business Rules

### Book Issuing Rules

1. **Member Eligibility:**
   - Member status must be 'active'
   - Membership must not be expired
   - Maximum 3 books allowed at a time
   - Pending fines must be < ₹500

2. **Book Availability:**
   - Book must exist in database
   - Available quantity must be > 0

3. **Duplicate Prevention:**
   - Member cannot issue the same book twice (if already issued)

### Fine Calculation Rules

1. **Fine Rate:** ₹5 per day after due date
2. **Calculation:** Days overdue × ₹5
3. **No Fine:** If returned on or before due date
4. **Automatic:** Fines are calculated automatically on return

### Due Date Rules

1. **Default Loan Period:** 14 days from issue date
2. **Calculation:** Issue date + 14 days

### Transaction Status

- **issued**: Book is currently issued
- **returned**: Book has been returned
- **overdue**: Book is overdue (status updates automatically)

---

## Database Transactions

All critical operations use database transactions to ensure data consistency:

- **Issue Book**: Creates transaction and decrements book quantity atomically
- **Return Book**: Updates transaction and increments book quantity atomically

If any step fails, the entire operation is rolled back.

---

## Email Notifications

The system automatically sends email notifications for:

1. **Book Issue Confirmation**
   - Sent when a book is issued
   - Includes book details and due date

2. **Book Return Confirmation**
   - Sent when a book is returned
   - Includes fine amount if applicable

3. **Due Date Reminders**
   - Can be scheduled (implementation pending)

4. **Overdue Notifications**
   - Sent when fine is calculated
   - Includes days overdue and fine amount

**Note:** Email sending is non-blocking and failures are logged but don't affect the transaction.

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common HTTP Status Codes

- `200` - OK
- `201` - Created (successful issue)
- `400` - Bad Request (validation errors, business rule violations)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Testing Examples

### Using cURL

```bash
# Issue a book
curl -X POST http://localhost:5000/api/transactions/issue \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": 1,
    "book_id": 5
  }'

# Return a book
curl -X POST http://localhost:5000/api/transactions/return/25 \
  -H "Authorization: Bearer <token>"

# Get member transactions
curl -X GET "http://localhost:5000/api/transactions/member/1" \
  -H "Authorization: Bearer <token>"

# Get overdue transactions
curl -X GET "http://localhost:5000/api/transactions/overdue" \
  -H "Authorization: Bearer <token>"

# Calculate fine
curl -X PATCH http://localhost:5000/api/transactions/20/calculate-fine \
  -H "Authorization: Bearer <token>"
```

---

## Configuration

Constants can be adjusted in `src/config/constants.js`:

```javascript
// Maximum books per member
MAX_BOOKS_PER_MEMBER = 3

// Maximum pending fine before blocking issue
MAX_PENDING_FINE = 500.00

// Default loan period (days)
LOAN_PERIOD_DAYS = 14

// Fine rate per day
FINE_RATE.DEFAULT = 5.00  // ₹5 per day
```

---

## Notes

1. **Data Consistency**: All operations use database transactions
2. **Row Locking**: Uses `FOR UPDATE` to prevent race conditions
3. **Automatic Updates**: Book quantities and transaction statuses update automatically
4. **Email Integration**: Email service is structured but requires actual SMTP configuration for production
5. **Fine Calculation**: Fines are calculated automatically but can be manually recalculated
6. **Member Access**: Members can only view their own transactions

