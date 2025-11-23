# Reservations & Fine Management API Documentation

Complete documentation for book reservations and fine management APIs in the Library Management System.

## Base URLs
- Reservations: `/api/reservations`
- Fines: `/api/fines`

---

## Reservation APIs

### 1. Create Reservation

Reserve a book (members create their own reservations).

**Endpoint:** `POST /api/reservations`

**Authentication:** Required

**Request Body:**

```json
{
  "book_id": 5
  // member_id is optional - members use their own ID automatically
}
```

**Business Rules:**
- ✅ Member must be active
- ✅ Book must exist
- ✅ Member cannot have the same book issued already
- ✅ Member cannot have duplicate pending reservations for same book
- ✅ Reservations are queued in order (first come, first served)

**Example Response (201):**

```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": 10,
    "member_id": 1,
    "book_id": 5,
    "reservation_date": "2024-01-20T10:00:00.000Z",
    "status": "pending",
    "queue_position": 3,
    "total_in_queue": 3
  }
}
```

**Notes:**
- Queue position indicates your place in line for this book
- Reservations are fulfilled in order (oldest first)

---

### 2. Get Member's Reservations

Get all reservations for a specific member. Members can only view their own reservations.

**Endpoint:** `GET /api/reservations/member/:memberId`

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
| `status` | string | No | Filter by status: `pending`, `fulfilled`, `cancelled`, `expired` |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "reservations": [
      {
        "id": 10,
        "member_id": 1,
        "book_id": 5,
        "reservation_date": "2024-01-20T10:00:00.000Z",
        "status": "pending",
        "book_title": "The Great Gatsby",
        "book_author": "F. Scott Fitzgerald",
        "book_isbn": "978-0-7432-7356-5",
        "queue_position": 2,
        "available_quantity": 0,
        "quantity": 5
      },
      {
        "id": 11,
        "status": "fulfilled",
        "book_title": "1984",
        "is_expired": false,
        "expiry_date": "2024-01-22T10:00:00.000Z",
        "hours_remaining": 24
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

---

### 3. Get All Reservations

Get all reservations with filters (Librarian/Admin only).

**Endpoint:** `GET /api/reservations`

**Authentication:** Required (Librarian/Admin only)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |
| `status` | string | No | Filter by status |
| `member_id` | integer | No | Filter by member ID |
| `book_id` | integer | No | Filter by book ID |

---

### 4. Fulfill Reservation

Mark a reservation as fulfilled when book becomes available (Librarian/Admin only).

**Endpoint:** `PATCH /api/reservations/:id/fulfill`

**Authentication:** Required (Librarian/Admin only)

**Business Rules:**
- ✅ Only the next reservation in queue can be fulfilled
- ✅ Book must be available
- ✅ Book is held for 48 hours for collection
- ✅ Email notification is sent to member

**Example Response (200):**

```json
{
  "success": true,
  "message": "Reservation fulfilled successfully",
  "data": {
    "reservation": {
      "id": 10,
      "status": "fulfilled",
      ...
    },
    "expiry_date": "2024-01-22T10:00:00.000Z",
    "hours_remaining": 48,
    "message": "Reservation fulfilled. Member has 48 hours to collect the book."
  }
}
```

**Notes:**
- Book quantity is decremented (book is held)
- Reservation expires after 48 hours if not collected
- Next person in queue will be notified when book becomes available again

---

### 5. Cancel Reservation

Cancel a reservation. Members can cancel their own, librarians can cancel any.

**Endpoint:** `DELETE /api/reservations/:id`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Reservation ID |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "data": {
    "id": 10,
    "status": "cancelled",
    ...
  }
}
```

**Notes:**
- If reservation was fulfilled, the book is released back to available
- Next person in queue can now get the book

---

### 6. Get Reservation by ID

Get detailed information about a specific reservation.

**Endpoint:** `GET /api/reservations/:id`

**Authentication:** Required

---

## Reservation Status Flow

```
pending → fulfilled → (collected via transaction) OR expired
     ↓
cancelled
```

**Statuses:**
- **pending**: Waiting in queue
- **fulfilled**: Book is available for collection (48-hour window)
- **cancelled**: Reservation was cancelled
- **expired**: Fulfilled reservation expired (not collected within 48 hours)

---

## Fine Management APIs

### 1. Get Member's Fines

Get all pending/unpaid fines for a member. Members can only view their own fines.

**Endpoint:** `GET /api/fines/member/:memberId`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memberId` | integer | Yes | Member ID |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "fines": [
      {
        "id": 25,
        "transaction_id": 25,
        "book_title": "The Great Gatsby",
        "book_author": "F. Scott Fitzgerald",
        "due_date": "2024-01-29",
        "fine_amount": 25.00,
        "total_paid": 10.00,
        "remaining_fine": 15.00,
        "status": "overdue"
      }
    ],
    "total_pending_fine": 15.00,
    "currency": "INR"
  }
}
```

---

### 2. Pay Fine

Pay a fine (members can pay their own fines).

**Endpoint:** `POST /api/fines/pay`

**Authentication:** Required

**Request Body:**

```json
{
  "transaction_id": 25,
  "amount": 15.00,
  "payment_method": "online"
}
```

**Payment Methods:**
- `cash`
- `card`
- `online`
- `other`

**Example Response (201):**

```json
{
  "success": true,
  "message": "Fine payment recorded successfully",
  "data": {
    "payment": {
      "id": 5,
      "transaction_id": 25,
      "amount": 15.00,
      "payment_method": "online",
      "payment_date": "2024-01-30T10:00:00.000Z"
    },
    "transaction": {
      "id": 25,
      "book_title": "The Great Gatsby",
      "fine_amount": 25.00,
      "total_paid": 25.00,
      "remaining_fine": 0.00,
      "is_paid_in_full": true
    },
    "receipt_id": 5
  }
}
```

**Business Rules:**
- ✅ Payment amount cannot exceed remaining fine
- ✅ Partial payments allowed
- ✅ Receipt is generated automatically

---

### 3. Get Fine Payment History

Get payment history for a member.

**Endpoint:** `GET /api/fines/history/:memberId`

**Authentication:** Required

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
    "payments": [
      {
        "id": 5,
        "transaction_id": 25,
        "amount": 15.00,
        "payment_method": "online",
        "payment_date": "2024-01-30T10:00:00.000Z",
        "book_title": "The Great Gatsby",
        "book_author": "F. Scott Fitzgerald",
        "transaction_fine_amount": 25.00,
        "member_code": "MEM001"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

### 4. Get Payment Receipt

Get receipt for a specific payment.

**Endpoint:** `GET /api/fines/receipt/:paymentId`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `paymentId` | integer | Yes | Payment ID |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "receipt": {
      "payment_id": 5,
      "transaction_id": 25,
      "amount": 15.00,
      "payment_method": "online",
      "payment_date": "2024-01-30T10:00:00.000Z",
      "book_title": "The Great Gatsby",
      "member_name": "john_doe",
      "member_code": "MEM001"
    }
  }
}
```

---

## Reservation Queue Management

### Queue Order

Reservations are processed in **first-come, first-served** order:

1. When a book becomes available, the oldest pending reservation is fulfilled first
2. Queue position is calculated based on reservation date
3. Members can see their position in the queue
4. Multiple reservations for the same book are queued automatically

### Reservation Expiry

- **Fulfillment Window**: 48 hours to collect the book
- **Automatic Expiry**: If not collected within 48 hours, reservation expires
- **Book Release**: Expired reservations release the book back to available
- **Next in Queue**: When a reservation expires, next person is notified

---

## Fine Calculation

### Fine Rates

- **Rate**: ₹5 per day after due date
- **Calculation**: Days overdue × ₹5
- **Currency**: INR (₹)

### Payment Tracking

- **Partial Payments**: Members can pay fines in multiple installments
- **Payment History**: Complete history of all payments per transaction
- **Receipts**: Receipt generated for each payment
- **Remaining Balance**: System tracks remaining fine after each payment

---

## Email Notifications

### Reservation Notifications

1. **Reservation Fulfillment**
   - Sent when book becomes available
   - Includes collection deadline (48 hours)
   - Sent automatically when reservation is fulfilled

2. **Expiry Reminder** (Future Implementation)
   - 24-hour reminder before reservation expires
   - Can be scheduled via cron job

### Fine Notifications

- Fine payment confirmations
- Receipt emails (can be added)
- Overdue reminders (from transaction system)

---

## Database Transactions

All critical operations use database transactions:

- **Reservation Fulfillment**: Updates reservation + reserves book (atomic)
- **Reservation Cancellation**: Updates reservation + releases book if fulfilled (atomic)
- **Fine Payment**: Creates payment + updates transaction (atomic)

---

## Error Handling

Standardized error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common Errors

- `400`: Bad Request (validation errors, business rule violations)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate reservation, etc.)

---

## Testing Examples

### Using cURL

```bash
# Create reservation
curl -X POST http://localhost:5000/api/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"book_id": 5}'

# Get member reservations
curl -X GET "http://localhost:5000/api/reservations/member/1" \
  -H "Authorization: Bearer <token>"

# Fulfill reservation (librarian)
curl -X PATCH http://localhost:5000/api/reservations/10/fulfill \
  -H "Authorization: Bearer <token>"

# Cancel reservation
curl -X DELETE http://localhost:5000/api/reservations/10 \
  -H "Authorization: Bearer <token>"

# Get member fines
curl -X GET "http://localhost:5000/api/fines/member/1" \
  -H "Authorization: Bearer <token>"

# Pay fine
curl -X POST http://localhost:5000/api/fines/pay \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": 25,
    "amount": 15.00,
    "payment_method": "online"
  }'

# Get payment receipt
curl -X GET "http://localhost:5000/api/fines/receipt/5" \
  -H "Authorization: Bearer <token>"
```

---

## Scheduled Jobs (Recommended)

### Reservation Expiry Check

Run periodically (e.g., every hour) to expire fulfilled reservations:

```javascript
// In a cron job or scheduled task
import { reservationModel } from './models/reservationModel.js';

async function checkExpiredReservations() {
  const expired = await reservationModel.expireReservations();
  logger.info(`Expired ${expired.length} reservations`);
}
```

---

## Configuration

Constants in `src/config/constants.js`:

```javascript
// Reservation expiry (hours)
RESERVATION_EXPIRY_HOURS = 48

// Payment methods
PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online',
  OTHER: 'other'
}
```

---

## Notes

1. **Queue Management**: Reservations are automatically queued based on reservation date
2. **Member Access**: Members can only view/manage their own reservations and fines
3. **Partial Payments**: Fine payments can be made in installments
4. **Receipt Tracking**: Each payment generates a receipt ID
5. **Expiry Handling**: Expired reservations automatically release books back to available
6. **Email Integration**: Email notifications are sent automatically (non-blocking)

