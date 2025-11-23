# Books Management API Documentation

Complete CRUD API endpoints for books management in the Library Management System.

## Base URL
```
/api/books
```

## Authentication

- **Public Endpoints**: No authentication required
- **Protected Endpoints**: Require JWT token in `Authorization: Bearer <token>` header
- **Role Requirements**: 
  - `POST`, `PUT`, `PATCH`: Librarian or Admin
  - `DELETE`: Admin only

---

## API Endpoints

### 1. Get All Books

Get a paginated list of all books with optional filtering and sorting.

**Endpoint:** `GET /api/books`

**Authentication:** Public

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |
| `search` | string | No | Search in title, author, ISBN |
| `category` | string | No | Filter by category |
| `author` | string | No | Filter by author (partial match) |
| `publisher` | string | No | Filter by publisher (partial match) |
| `available` | string | No | Filter by availability (`true` or `false`) |
| `publication_year_from` | integer | No | Filter by minimum publication year |
| `publication_year_to` | integer | No | Filter by maximum publication year |
| `sortBy` | string | No | Sort field: `title`, `author`, `publication_year`, `created_at`, `category` (default: `title`) |
| `sortOrder` | string | No | Sort order: `ASC` or `DESC` (default: `ASC`) |

**Example Request:**
```bash
GET /api/books?page=1&limit=20&category=Fiction&sortBy=publication_year&sortOrder=DESC
```

**Example Response (200):**
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "books": [
      {
        "id": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "978-0-7432-7356-5",
        "publisher": "Scribner",
        "publication_year": 1925,
        "category": "Fiction",
        "quantity": 5,
        "available_quantity": 3,
        "description": "A classic American novel...",
        "cover_image_url": "https://example.com/covers/great-gatsby.jpg",
        "created_at": "2023-01-01T10:00:00.000Z",
        "updated_at": "2023-01-01T10:00:00.000Z"
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

### 2. Get Book by ID

Get detailed information about a specific book.

**Endpoint:** `GET /api/books/:id`

**Authentication:** Public

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Book ID |

**Example Request:**
```bash
GET /api/books/1
```

**Example Response (200):**
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "book": {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5",
      "publisher": "Scribner",
      "publication_year": 1925,
      "category": "Fiction",
      "quantity": 5,
      "available_quantity": 3,
      "description": "A classic American novel...",
      "cover_image_url": "https://example.com/covers/great-gatsby.jpg",
      "created_at": "2023-01-01T10:00:00.000Z",
      "updated_at": "2023-01-01T10:00:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Book not found"
}
```

---

### 3. Create Book

Create a new book in the system.

**Endpoint:** `POST /api/books`

**Authentication:** Required (Librarian or Admin)

**Request Body:**

```json
{
  "title": "New Book Title",
  "author": "Author Name",
  "isbn": "978-0-1234-5678-9",
  "publisher": "Publisher Name",
  "publication_year": 2023,
  "category": "Fiction",
  "quantity": 10,
  "available_quantity": 10,
  "description": "Book description here...",
  "cover_image_url": "https://example.com/cover.jpg"
}
```

**Required Fields:**
- `title` (string, max 500 chars)
- `author` (string, max 255 chars)
- `isbn` (string, max 20 chars, unique)
- `quantity` (integer, >= 0)

**Optional Fields:**
- `publisher` (string, max 255 chars)
- `publication_year` (integer, 1000-current year+1)
- `category` (string, max 100 chars)
- `available_quantity` (integer, >= 0, defaults to quantity)
- `description` (text)
- `cover_image_url` (valid HTTP/HTTPS URL)

**Example Response (201):**
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "book": {
      "id": 16,
      "title": "New Book Title",
      "author": "Author Name",
      ...
    }
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "Book with this ISBN already exists"
}
```

---

### 4. Update Book

Update an existing book's information.

**Endpoint:** `PUT /api/books/:id`

**Authentication:** Required (Librarian or Admin)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Book ID |

**Request Body:** (All fields optional, only include fields to update)

```json
{
  "title": "Updated Title",
  "author": "Updated Author",
  "quantity": 15,
  "category": "Non-Fiction"
}
```

**Example Response (200):**
```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": {
    "book": {
      "id": 1,
      "title": "Updated Title",
      ...
    }
  }
}
```

---

### 5. Delete Book

Delete a book from the system.

**Endpoint:** `DELETE /api/books/:id`

**Authentication:** Required (Admin only)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Book ID |

**Example Response (204):**
```
No Content
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete book with active transactions. Please wait for all books to be returned."
}
```

**Note:** Books with active transactions (issued or overdue) cannot be deleted.

---

### 6. Search Books

Search books by query string (searches title, author, ISBN, description, publisher).

**Endpoint:** `GET /api/books/search`

**Authentication:** Public

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |

**Example Request:**
```bash
GET /api/books/search?q=gatsby&page=1&limit=10
```

**Example Response (200):**
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "books": [...],
    "pagination": {...},
    "query": "gatsby"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Search query is required"
}
```

---

### 7. Get Books by Category

Get all books in a specific category.

**Endpoint:** `GET /api/books/category/:category`

**Authentication:** Public

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | Category name |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |
| `sortBy` | string | No | Sort field (default: `title`) |
| `sortOrder` | string | No | Sort order: `ASC` or `DESC` (default: `ASC`) |

**Example Request:**
```bash
GET /api/books/category/Fiction?sortBy=publication_year&sortOrder=DESC
```

**Example Response (200):**
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "books": [...],
    "pagination": {...},
    "category": "Fiction"
  }
}
```

---

### 8. Get All Categories

Get a list of all unique categories with book counts.

**Endpoint:** `GET /api/books/categories`

**Authentication:** Public

**Example Response (200):**
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "categories": [
      {
        "category": "Fiction",
        "book_count": "45"
      },
      {
        "category": "Non-Fiction",
        "book_count": "32"
      }
    ]
  }
}
```

---

### 9. Update Book Quantity

Update the quantity and available quantity of a book.

**Endpoint:** `PATCH /api/books/:id/quantity`

**Authentication:** Required (Librarian or Admin)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Book ID |

**Request Body:**

```json
{
  "quantity": 20,
  "available_quantity": 15
}
```

**Required Fields:**
- `quantity` (integer, >= 0)

**Optional Fields:**
- `available_quantity` (integer, >= 0, defaults to quantity)

**Note:** `available_quantity` will be automatically adjusted to not exceed `quantity`.

**Example Response (200):**
```json
{
  "success": true,
  "message": "Book quantity updated successfully",
  "data": {
    "book": {
      "id": 1,
      "quantity": 20,
      "available_quantity": 15,
      ...
    }
  }
}
```

---

## Error Responses

All endpoints follow a standard error response format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "title",
      "message": "Title is required",
      "value": ""
    }
  ]
}
```

### Common HTTP Status Codes

- `200` - OK (successful GET, PUT, PATCH)
- `201` - Created (successful POST)
- `204` - No Content (successful DELETE)
- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate ISBN, etc.)
- `500` - Internal Server Error

---

## Filtering and Sorting Examples

### Filter by Multiple Criteria
```
GET /api/books?category=Fiction&author=Fitzgerald&available=true&publication_year_from=1900&publication_year_to=1950
```

### Sort by Publication Year (Newest First)
```
GET /api/books?sortBy=publication_year&sortOrder=DESC
```

### Search and Filter Combined
```
GET /api/books?search=gatsby&category=Fiction&available=true
```

### Pagination with Filters
```
GET /api/books?page=2&limit=20&category=Non-Fiction&sortBy=title
```

---

## Response Format Standardization

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data here
  }
}
```

Pagination metadata (when applicable):

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Database Queries

All queries use parameterized statements to prevent SQL injection:

```sql
-- Example: Get books with filters
SELECT * FROM books
WHERE category = $1 
  AND available_quantity > 0
  AND (title ILIKE $2 OR author ILIKE $2)
ORDER BY title ASC
LIMIT $3 OFFSET $4
```

The system uses indexes on:
- `books.title`
- `books.author`
- `books.isbn`
- `books.category`
- `books.available_quantity`

---

## Testing Examples

### Using cURL

```bash
# Get all books
curl -X GET http://localhost:5000/api/books

# Search books
curl -X GET "http://localhost:5000/api/books/search?q=harry"

# Create book (requires authentication)
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "isbn": "1234567890",
    "quantity": 5
  }'

# Update book
curl -X PUT http://localhost:5000/api/books/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10}'

# Delete book (admin only)
curl -X DELETE http://localhost:5000/api/books/1 \
  -H "Authorization: Bearer <token>"
```

---

## Notes

1. **ISBN Uniqueness**: Each ISBN must be unique in the system
2. **Quantity Management**: `available_quantity` cannot exceed `quantity`
3. **Book Deletion**: Books with active transactions cannot be deleted
4. **Case Insensitive Search**: All text searches are case-insensitive
5. **Pagination Limits**: Maximum 100 items per page to prevent performance issues
6. **Sorting**: Default sort is by title (ascending)
7. **Date Formats**: All dates are returned in ISO 8601 format (UTC)

