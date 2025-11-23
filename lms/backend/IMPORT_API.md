# Excel Import API Documentation

## Overview

The Import API provides endpoints to bulk import data from Excel files into the Library Management System database. All import endpoints require authentication and are restricted to Librarian and Admin roles.

## Base URL

```
http://localhost:5000/api/import
```

## Authentication

All import endpoints require:
- **Authentication**: Bearer token (JWT)
- **Authorization**: Librarian or Admin role only

Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Download Book Import Template

Download an Excel template file with the correct format and example data.

**Endpoint**: `GET /api/import/books/template`

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/import/books/template" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output book_import_template.xlsx
```

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download: `book_import_template.xlsx`

**Template Features**:
- Pre-filled headers
- Example row with sample data
- Instructions included in the file
- Proper column formatting

**Required Columns**:
- `Title` (required)
- `Author` (required)
- `ISBN` (required)

**Optional Columns**:
- `Publisher`
- `Publication Year`
- `Category`
- `Quantity` (default: 0)
- `Available Quantity` (default: same as Quantity)
- `Description`
- `Cover Image URL`

---

### 2. Import Books from Excel

Import books from an Excel file (.xlsx or .xls format).

**Endpoint**: `POST /api/import/books`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file` (required): Excel file (.xlsx or .xls)
- `duplicateAction` (optional): Action for duplicate ISBNs
  - `skip` (default): Skip duplicate entries
  - `update`: Update existing books with new data

**File Requirements**:
- Format: `.xlsx` or `.xls`
- Maximum size: 5MB
- Must contain header row with column names
- Column names are case-insensitive

**Example Request (cURL)**:
```bash
curl -X POST "http://localhost:5000/api/import/books" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@books.xlsx" \
  -F "duplicateAction=update"
```

**Example Request (JavaScript/Fetch)**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('duplicateAction', 'update');

const response = await fetch('http://localhost:5000/api/import/books', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

**Example Request (Node.js/Axios)**:
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const formData = new FormData();
formData.append('file', fs.createReadStream('books.xlsx'));
formData.append('duplicateAction', 'update');

const response = await axios.post(
  'http://localhost:5000/api/import/books',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    }
  }
);

console.log(response.data);
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Import completed: 50 books created, 5 updated, 2 skipped, 3 failed",
  "data": {
    "total": 60,
    "success": 50,
    "failed": 3,
    "skipped": 2,
    "updated": 5,
    "errors": [
      {
        "row": 15,
        "data": {
          "title": "Invalid Book",
          "author": "",
          "isbn": "123"
        },
        "errors": [
          "Author is required",
          "ISBN must be less than 20 characters"
        ]
      }
    ]
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Import failed due to too many errors. Transaction rolled back.",
  "data": {
    "total": 100,
    "success": 0,
    "failed": 60,
    "skipped": 0,
    "updated": 0,
    "errors": [...]
  }
}
```

---

## Validation Rules

### Required Fields
- **Title**: String, 1-500 characters
- **Author**: String, 1-255 characters
- **ISBN**: String, 1-20 characters

### Optional Fields
- **Publisher**: String, max 255 characters
- **Publication Year**: Integer, 1000 to current year + 1
- **Category**: String, max 100 characters
- **Quantity**: Integer, >= 0 (default: 0)
- **Available Quantity**: Integer, >= 0 (default: same as Quantity)
- **Description**: String
- **Cover Image URL**: Valid HTTP/HTTPS URL

### Validation Errors
- Missing required fields
- Invalid data types
- Values outside allowed ranges
- Invalid URL formats
- Duplicate ISBNs (when duplicateAction=skip)

---

## Duplicate Handling

### Skip Mode (default)
- If a book with the same ISBN exists, the row is skipped
- Error is reported in the response
- No changes are made to existing book

### Update Mode
- If a book with the same ISBN exists, it is updated with new data
- All fields from the Excel row replace existing values
- Original book ID is preserved

---

## Transaction Management

### Automatic Rollback
The import uses database transactions to ensure data integrity:
- If more than 50% of rows fail, the entire transaction is rolled back
- No books are inserted if critical errors occur
- All-or-nothing approach for data consistency

### Partial Success
- If less than 50% of rows fail, successful rows are committed
- Failed rows are reported in the response
- Database remains in a consistent state

---

## Error Responses

### 400 Bad Request

**No file uploaded**:
```json
{
  "success": false,
  "message": "No file uploaded. Please upload an Excel file."
}
```

**Invalid file type**:
```json
{
  "success": false,
  "message": "Invalid file type. Only Excel files (.xlsx, .xls) are allowed."
}
```

**File too large**:
```json
{
  "success": false,
  "message": "File size exceeds the limit of 5MB"
}
```

**Empty file**:
```json
{
  "success": false,
  "message": "No data found in Excel file"
}
```

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

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to import books from Excel file"
}
```

---

## Excel File Format

### Header Row
The first row must contain column headers. Headers are case-insensitive.

**Example Headers**:
```
Title | Author | ISBN | Publisher | Publication Year | Category | Quantity | Available Quantity | Description | Cover Image URL
```

### Data Rows
Each subsequent row represents one book. Empty rows are ignored.

**Example Row**:
```
The Great Gatsby | F. Scott Fitzgerald | 978-0-7432-7356-5 | Scribner | 1925 | Fiction | 10 | 10 | A classic American novel | https://example.com/cover.jpg
```

### Column Mapping
The system automatically maps columns based on header names:
- `title` → Title
- `author` → Author
- `isbn` → ISBN
- `publisher` → Publisher
- `publication_year` or `publication year` → Publication Year
- `category` → Category
- `quantity` → Quantity
- `available_quantity` or `available quantity` → Available Quantity
- `description` → Description
- `cover_image_url` or `cover image url` → Cover Image URL

---

## Best Practices

1. **Download Template First**: Use the template endpoint to get the correct format
2. **Validate Data**: Check your Excel file before uploading
3. **Test with Small Files**: Start with a few rows to test the format
4. **Handle Duplicates**: Decide whether to skip or update duplicates
5. **Review Errors**: Check the error report to fix data issues
6. **Backup Database**: Always backup before bulk imports
7. **Use Transactions**: The system automatically uses transactions for safety

## Security Features

1. **File Type Validation**: Only .xlsx and .xls files accepted
2. **File Size Limit**: Maximum 5MB per file
3. **MIME Type Check**: Validates file MIME types
4. **Authentication Required**: All endpoints require valid JWT token
5. **Role-Based Access**: Only Librarian and Admin can import
6. **Input Validation**: All data is validated before insertion
7. **SQL Injection Prevention**: Parameterized queries used throughout

## Rate Limiting

Import endpoints are subject to general rate limiting:
- **Limit**: 100 requests per 15 minutes per IP

## Performance Considerations

- Large files may take several seconds to process
- Processing is done row-by-row for detailed error reporting
- Database transactions ensure data consistency
- Memory-efficient file processing (streaming)

## Troubleshooting

### Common Issues

1. **"No file uploaded"**
   - Ensure the form field is named `file`
   - Check that the file is actually being sent

2. **"Invalid file type"**
   - Ensure file is .xlsx or .xls format
   - Check file extension matches actual format

3. **"File size exceeds limit"**
   - Reduce file size or split into multiple files
   - Maximum size is 5MB

4. **"No data found"**
   - Ensure Excel file has data rows
   - Check that header row is present
   - Verify file is not corrupted

5. **Many validation errors**
   - Download template to see correct format
   - Check required fields are present
   - Verify data types match requirements

## Support

For issues or questions:
- Check API documentation at `/api-docs`
- Review error messages in response
- Verify authentication token is valid
- Ensure user has Librarian or Admin role
- Download template to verify format

