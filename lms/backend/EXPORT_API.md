# Excel Export API Documentation

## Overview

The Export API provides endpoints to export data from the Library Management System database to Excel files (.xlsx format). All export endpoints require authentication and are restricted to Librarian and Admin roles.

## Base URL

```
http://localhost:5000/api/export
```

## Authentication

All export endpoints require:
- **Authentication**: Bearer token (JWT)
- **Authorization**: Librarian or Admin role only

Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Export Books

Export all books to Excel with optional filters.

**Endpoint**: `GET /api/export/books`

**Query Parameters**:
- `category` (optional): Filter by book category
- `search` (optional): Search in title, author, or ISBN
- `status` (optional): Filter by availability
  - `available`: Books with available_quantity > 0
  - `unavailable`: Books with available_quantity = 0

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/export/books?category=Fiction&status=available" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output books.xlsx
```

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with filename: `books_export_YYYY-MM-DDTHH-MM-SS.xlsx`

**Excel Columns**:
- ID
- Title
- Author
- ISBN
- Publisher
- Year
- Category
- Total Qty
- Available
- Description
- Created At
- Updated At

---

### 2. Export Members

Export all members to Excel with optional filters.

**Endpoint**: `GET /api/export/members`

**Query Parameters**:
- `status` (optional): Filter by member status
  - `active`: Active members
  - `inactive`: Inactive members
- `search` (optional): Search in username, email, member_id, or phone

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/export/members?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output members.xlsx
```

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with filename: `members_export_YYYY-MM-DDTHH-MM-SS.xlsx`

**Excel Columns**:
- ID
- Member ID
- Username
- Email
- Role
- Phone
- Address
- Membership Date
- Expiry Date
- Status
- Created At
- Updated At

---

### 3. Export Transactions

Export transaction history to Excel with optional filters.

**Endpoint**: `GET /api/export/transactions`

**Query Parameters**:
- `start_date` (optional): Start date filter (ISO 8601 format: YYYY-MM-DD)
- `end_date` (optional): End date filter (ISO 8601 format: YYYY-MM-DD)
- `status` (optional): Filter by transaction status
  - `issued`: Currently issued books
  - `returned`: Returned books
  - `overdue`: Overdue books
- `member_id` (optional): Filter by member ID
- `book_id` (optional): Filter by book ID

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/export/transactions?start_date=2023-01-01&end_date=2023-12-31&status=issued" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output transactions.xlsx
```

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with filename: `transactions_export_YYYY-MM-DDTHH-MM-SS.xlsx`

**Excel Columns**:
- ID
- Member ID
- Member Code
- Member Name
- Member Email
- Book ID
- Book Title
- Author
- ISBN
- Issue Date
- Due Date
- Return Date
- Fine Amount
- Status
- Created At
- Updated At

---

### 4. Export All (Complete Database)

Export complete database to Excel with multiple sheets.

**Endpoint**: `GET /api/export/all`

**Query Parameters**:
- `start_date` (optional): Start date filter for transactions (ISO 8601 format: YYYY-MM-DD)
- `end_date` (optional): End date filter for transactions (ISO 8601 format: YYYY-MM-DD)

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/export/all?start_date=2023-01-01&end_date=2023-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output complete_export.xlsx
```

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with filename: `complete_export_YYYY-MM-DDTHH-MM-SS.xlsx`

**Excel Sheets**:
1. **Books**: All books in the system
2. **Members**: All members with user information
3. **Transactions**: Transaction history (filtered by date if provided)
4. **Reservations**: All book reservations
5. **Fine Payments**: All fine payment records

---

## Excel File Features

### Formatting
- **Header Row**: Bold text with gray background
- **Column Widths**: Auto-sized for readability
- **Frozen Headers**: First row is frozen for easy scrolling
- **Alignment**: Headers centered, data left-aligned

### Filename Format
All exported files include a timestamp in the filename:
- Format: `{type}_export_YYYY-MM-DDTHH-MM-SS.xlsx`
- Example: `books_export_2023-11-15T14-30-45.xlsx`

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized. Please provide a valid token."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden. Librarian or Admin access required."
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "start_date",
      "message": "Start date must be in ISO 8601 format (YYYY-MM-DD)"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to export data"
}
```

## Usage Examples

### JavaScript/Fetch

```javascript
async function exportBooks() {
  const token = 'YOUR_JWT_TOKEN';
  
  const response = await fetch('http://localhost:5000/api/export/books', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books_export.xlsx';
    a.click();
  }
}
```

### Node.js/Axios

```javascript
const axios = require('axios');
const fs = require('fs');

async function exportBooks() {
  const token = 'YOUR_JWT_TOKEN';
  
  const response = await axios({
    method: 'GET',
    url: 'http://localhost:5000/api/export/books',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'stream'
  });
  
  const writer = fs.createWriteStream('books_export.xlsx');
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
```

### Python/Requests

```python
import requests

def export_books():
    token = 'YOUR_JWT_TOKEN'
    url = 'http://localhost:5000/api/export/books'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(url, headers=headers, stream=True)
    
    if response.status_code == 200:
        with open('books_export.xlsx', 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print('Export completed!')
    else:
        print(f'Error: {response.status_code}')
```

## Best Practices

1. **Date Filters**: Always use ISO 8601 format (YYYY-MM-DD) for date filters
2. **Large Exports**: For large datasets, consider using date range filters
3. **Error Handling**: Always check response status before processing the file
4. **File Naming**: The API automatically includes timestamps in filenames
5. **Authentication**: Store tokens securely and refresh when expired

## Rate Limiting

Export endpoints are subject to general rate limiting:
- **Limit**: 100 requests per 15 minutes per IP

## Notes

- All exports are generated on-demand
- Large exports may take several seconds to generate
- Excel files use the `.xlsx` format (Excel 2007+)
- Files are streamed directly to the client (no server-side storage)
- Timestamps in filenames use UTC timezone

## Support

For issues or questions:
- Check API documentation at `/api-docs`
- Review error messages in response
- Verify authentication token is valid
- Ensure user has Librarian or Admin role

