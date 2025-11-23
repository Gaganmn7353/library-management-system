# Analytics and Reports API

This document outlines the API endpoints for the admin dashboard analytics and reporting system.

---

## 1. Dashboard Statistics API (`/api/dashboard`)

All dashboard routes require **admin authentication**.

### `GET /api/dashboard/stats` - Overall Statistics

*   **Description:** Get comprehensive dashboard statistics including books, members, transactions, fines, and reservations.
*   **Access:** Admin only.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "stats": {
          "books": {
            "total": 1500,
            "available": 1200,
            "unavailable": 300,
            "total_copies": 5000,
            "total_available_copies": 3500,
            "borrowed": 1500
          },
          "members": {
            "total": 500,
            "active": 450,
            "inactive": 30,
            "suspended": 20
          },
          "transactions": {
            "issued": 1200,
            "overdue": 45,
            "returned": 8500,
            "issued_today": 15,
            "issued_this_week": 120,
            "issued_this_month": 450
          },
          "fines": {
            "pending": 1250.50,
            "total_collected": 5000.00,
            "collected_this_month": 850.00
          },
          "reservations": {
            "pending": 25,
            "fulfilled": 150
          },
          "users": {
            "admins": 3,
            "librarians": 10,
            "members": 500
          }
        },
        "generated_at": "2023-11-20T10:00:00.000Z"
      }
    }
    ```

### `GET /api/dashboard/popular-books` - Most Issued Books

*   **Description:** Get list of most popular books based on issue count.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `limit`: (Optional) Number of books to return (default: 10, max: 100).
    *   `start_date`: (Optional) Filter transactions from this date (YYYY-MM-DD).
    *   `end_date`: (Optional) Filter transactions up to this date (YYYY-MM-DD).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "books": [
          {
            "id": 101,
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "978-0-7432-7356-5",
            "category": "Fiction",
            "quantity": 10,
            "available_quantity": 3,
            "issue_count": 125,
            "currently_issued": 7,
            "currently_overdue": 2
          }
        ]
      }
    }
    ```

### `GET /api/dashboard/active-members` - Active Members

*   **Description:** Get list of most active members based on transaction count.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `limit`: (Optional) Number of members to return (default: 10, max: 100).
    *   `start_date`: (Optional) Filter transactions from this date (YYYY-MM-DD).
    *   `end_date`: (Optional) Filter transactions up to this date (YYYY-MM-DD).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "members": [
          {
            "id": 1,
            "member_id": "MEM001",
            "username": "john_doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "membership_date": "2023-01-15",
            "membership_expiry": "2024-01-15",
            "status": "active",
            "total_transactions": 45,
            "active_issues": 2,
            "overdue_count": 0,
            "pending_fines": 0.00,
            "total_fines_paid": 25.00
          }
        ]
      }
    }
    ```

### `GET /api/dashboard/revenue` - Revenue Statistics

*   **Description:** Get fine collection revenue statistics.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `start_date`: (Optional) Filter payments from this date (YYYY-MM-DD).
    *   `end_date`: (Optional) Filter payments up to this date (YYYY-MM-DD).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "revenue": {
          "total_revenue": 5000.00,
          "total_payments": 150,
          "transactions_paid": 120,
          "by_method": {
            "cash": {
              "amount": 2000.00,
              "count": 60
            },
            "card": {
              "amount": 1500.00,
              "count": 45
            },
            "online": {
              "amount": 1200.00,
              "count": 35
            },
            "other": {
              "amount": 300.00,
              "count": 10
            }
          },
          "average_payment": 33.33,
          "first_payment_date": "2023-01-15T10:00:00.000Z",
          "last_payment_date": "2023-11-20T15:30:00.000Z"
        },
        "period": {
          "start_date": null,
          "end_date": null
        }
      }
    }
    ```

### `GET /api/dashboard/popular-categories` - Popular Categories

*   **Description:** Get list of most popular book categories based on transaction count.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `limit`: (Optional) Number of categories to return (default: 10, max: 100).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "categories": [
          {
            "category": "Fiction",
            "book_count": 250,
            "transaction_count": 1200,
            "total_copies": 500,
            "available_copies": 350
          }
        ]
      }
    }
    ```

---

## 2. Reports API (`/api/reports`)

All reports routes require **admin authentication** and support CSV export.

### `GET /api/reports/circulation` - Circulation Report

*   **Description:** Get transaction circulation report grouped by day, week, or month.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `start_date`: (Optional) Filter transactions from this date (YYYY-MM-DD).
    *   `end_date`: (Optional) Filter transactions up to this date (YYYY-MM-DD).
    *   `group_by`: (Optional) Group by `day`, `week`, or `month` (default: `day`).
    *   `export_csv`: (Optional) Set to `true` to export as CSV file.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "report": [
          {
            "period": "2023-11-20",
            "total_transactions": 25,
            "issued_count": 15,
            "returned_count": 10,
            "overdue_count": 2,
            "unique_members": 20,
            "unique_books": 18,
            "total_fines": 50.00
          }
        ],
        "summary": {
          "total_periods": 30,
          "total_transactions": 750,
          "total_fines": 1500.00
        },
        "filters": {
          "start_date": "2023-11-01",
          "end_date": "2023-11-30",
          "group_by": "day"
        }
      }
    }
    ```
*   **CSV Export:** When `export_csv=true`, returns a CSV file with columns: Period, Total Transactions, Issued, Returned, Overdue, Unique Members, Unique Books, Total Fines.

### `GET /api/reports/overdue` - Overdue Report

*   **Description:** Get current overdue books report with member and fine details.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `export_csv`: (Optional) Set to `true` to export as CSV file.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "report": [
          {
            "transaction_id": 125,
            "member_code": "MEM001",
            "member_name": "John Doe",
            "member_email": "john@example.com",
            "book_title": "The Great Gatsby",
            "book_author": "F. Scott Fitzgerald",
            "book_isbn": "978-0-7432-7356-5",
            "issue_date": "2023-11-01",
            "due_date": "2023-11-15",
            "days_overdue": 5,
            "fine_amount": 25.00,
            "paid_amount": 0.00,
            "remaining_fine": 25.00
          }
        ],
        "summary": {
          "total_overdue": 45,
          "total_fine_amount": 1250.50,
          "total_paid": 250.00,
          "total_remaining": 1000.50,
          "average_days_overdue": 8
        }
      }
    }
    ```
*   **CSV Export:** When `export_csv=true`, returns a CSV file with all transaction details.

### `GET /api/reports/inventory` - Inventory Report

*   **Description:** Get complete inventory report with stock status.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `category`: (Optional) Filter by book category.
    *   `low_stock`: (Optional) Set to `true` to show only low stock items (≤2 copies).
    *   `export_csv`: (Optional) Set to `true` to export as CSV file.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "report": [
          {
            "book_id": 101,
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "978-0-7432-7356-5",
            "category": "Fiction",
            "publisher": "Scribner",
            "publication_year": 1925,
            "quantity": 10,
            "available_quantity": 3,
            "borrowed_count": 7,
            "stock_status": "in_stock",
            "total_issues": 125,
            "current_issues": 7
          }
        ],
        "summary": {
          "total_books": 1500,
          "total_copies": 5000,
          "total_available": 3500,
          "total_borrowed": 1500,
          "out_of_stock": 50,
          "low_stock": 120,
          "in_stock": 1330
        },
        "filters": {
          "category": null,
          "low_stock_only": false
        }
      }
    }
    ```
*   **Stock Status Values:**
    *   `in_stock`: Available quantity > 2
    *   `low_stock`: Available quantity ≤ 2 and > 0
    *   `out_of_stock`: Available quantity = 0
*   **CSV Export:** When `export_csv=true`, returns a CSV file with all book details.

### `GET /api/reports/members` - Membership Report

*   **Description:** Get comprehensive membership report with transaction and fine details.
*   **Access:** Admin only.
*   **Query Parameters:**
    *   `status`: (Optional) Filter by member status (`active`, `inactive`, `suspended`).
    *   `start_date`: (Optional) Filter members by membership date from this date (YYYY-MM-DD).
    *   `end_date`: (Optional) Filter members by membership date up to this date (YYYY-MM-DD).
    *   `export_csv`: (Optional) Set to `true` to export as CSV file.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resource retrieved successfully",
      "data": {
        "report": [
          {
            "member_id": 1,
            "member_code": "MEM001",
            "username": "john_doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "address": "123 Main St",
            "membership_date": "2023-01-15",
            "membership_expiry": "2024-01-15",
            "status": "active",
            "membership_status": "active",
            "total_transactions": 45,
            "active_issues": 2,
            "pending_fines": 0.00,
            "total_fines_paid": 25.00
          }
        ],
        "summary": {
          "total_members": 500,
          "by_status": {
            "active": 450,
            "inactive": 30,
            "suspended": 20
          },
          "by_membership_status": {
            "active": 400,
            "expired": 50,
            "expiring_soon": 50
          },
          "total_pending_fines": 1250.50,
          "total_fines_paid": 5000.00
        },
        "filters": {
          "status": null,
          "start_date": null,
          "end_date": null
        }
      }
    }
    ```
*   **Membership Status Values:**
    *   `active`: Membership expiry date is in the future (more than 30 days away)
    *   `expiring_soon`: Membership expires within 30 days
    *   `expired`: Membership has expired
*   **CSV Export:** When `export_csv=true`, returns a CSV file with all member details.

---

## 3. CSV Export Functionality

All report endpoints support CSV export by adding `export_csv=true` to the query parameters.

### Features:
*   **Automatic Filename:** Files are named with timestamp (e.g., `circulation_report_2023-11-20T10-00-00.csv`)
*   **Proper Escaping:** Handles commas, quotes, and newlines in data
*   **Headers:** Includes descriptive column headers
*   **Content-Type:** Sets appropriate headers for CSV download

### Example Usage:
```bash
# Get circulation report as CSV
GET /api/reports/circulation?start_date=2023-11-01&end_date=2023-11-30&export_csv=true

# Get overdue report as CSV
GET /api/reports/overdue?export_csv=true
```

---

## 4. SQL Query Optimization

All analytics queries are optimized with:
*   **Indexes:** Leverages existing database indexes on foreign keys and frequently queried columns
*   **Aggregations:** Uses SQL aggregations (COUNT, SUM, AVG) instead of application-level calculations
*   **Efficient Joins:** Uses LEFT JOINs only when necessary
*   **Date Filtering:** Uses indexed date columns for date range filtering
*   **Grouping:** Efficient GROUP BY clauses for period-based reports

---

## 5. Error Handling

All endpoints return standardized error responses:
*   `400 Bad Request`: Invalid query parameters or date formats
*   `401 Unauthorized`: Missing or invalid authentication token
*   `403 Forbidden`: Non-admin user attempting to access
*   `500 Internal Server Error`: Database or server errors

---

## 6. Performance Considerations

*   **Caching:** Consider implementing Redis caching for frequently accessed statistics
*   **Pagination:** Large reports can be paginated (future enhancement)
*   **Background Jobs:** Consider generating large CSV exports asynchronously
*   **Database Indexes:** Ensure indexes exist on:
    *   `transactions.issue_date`
    *   `transactions.due_date`
    *   `transactions.status`
    *   `fine_payments.payment_date`
    *   `members.membership_date`
    *   `members.membership_expiry`

---

## 7. Usage Examples

### Get Dashboard Statistics
```bash
curl -X GET "http://localhost:5000/api/dashboard/stats" \
  -H "Authorization: Bearer <admin_token>"
```

### Get Popular Books (Last Month)
```bash
curl -X GET "http://localhost:5000/api/dashboard/popular-books?limit=20&start_date=2023-10-01&end_date=2023-10-31" \
  -H "Authorization: Bearer <admin_token>"
```

### Get Circulation Report (CSV Export)
```bash
curl -X GET "http://localhost:5000/api/reports/circulation?start_date=2023-11-01&end_date=2023-11-30&group_by=week&export_csv=true" \
  -H "Authorization: Bearer <admin_token>" \
  -o circulation_report.csv
```

### Get Overdue Report
```bash
curl -X GET "http://localhost:5000/api/reports/overdue" \
  -H "Authorization: Bearer <admin_token>"
```

---

The analytics and reporting system is complete and ready for production use! 📊

