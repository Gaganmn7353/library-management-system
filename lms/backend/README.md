# Library Management System - Backend API

A Node.js + Express backend API for a library management system using PostgreSQL.

## Project Structure

```
lms/backend/
├── src/
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection pool
│   │   ├── env.js            # Environment configuration
│   │   └── constants.js      # Application constants
│   ├── models/               # Database models/queries
│   │   ├── userModel.js
│   │   ├── bookModel.js
│   │   ├── memberModel.js
│   │   ├── transactionModel.js
│   │   ├── reservationModel.js
│   │   └── finePaymentModel.js
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── memberController.js
│   │   ├── transactionController.js
│   │   ├── reservationController.js
│   │   └── finePaymentController.js
│   ├── routes/               # API routes
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── reservationRoutes.js
│   │   └── finePaymentRoutes.js
│   ├── middleware/           # Middleware functions
│   │   ├── auth.js           # Authentication & authorization
│   │   ├── errorHandler.js   # Error handling
│   │   └── morgan.js         # HTTP request logging
│   ├── utils/                # Helper functions
│   │   ├── helpers.js        # General helpers
│   │   ├── validators.js     # Validation rules
│   │   └── logger.js         # Winston logger
│   └── app.js                # Express app setup
├── schema.sql                # PostgreSQL schema
├── init_data.sql             # Sample data
├── DATABASE_SETUP.md         # Database setup guide
├── .env.example              # Environment variables example
├── .gitignore
├── package.json
└── server.js                 # Entry point
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database:**
   - Follow the instructions in `DATABASE_SETUP.md`
   - Create the database and run `schema.sql`
   - (Optional) Load sample data with `init_data.sql`

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and configuration.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Start the production server:**
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

# Database Connection Pool Configuration
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10

# Session Configuration
SESSION_SECRET=your-session-secret-change-in-production
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (if using sessions)
- `GET /api/auth/me` - Get current user profile

### Books
- `GET /api/books` - Get all books (with pagination and search)
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create a new book (Admin/Librarian only)
- `PUT /api/books/:id` - Update book (Admin/Librarian only)
- `DELETE /api/books/:id` - Delete book (Admin/Librarian only)

### Members
- `GET /api/members` - Get all members (Librarian/Admin only)
- `GET /api/members/:id` - Get member by ID
- `POST /api/members` - Create a new member (Librarian/Admin only)
- `PUT /api/members/:id` - Update member (Librarian/Admin only)
- `DELETE /api/members/:id` - Delete member (Librarian/Admin only)
- `GET /api/members/:id/transactions` - Get member's transactions
- `GET /api/members/:id/reservations` - Get member's reservations

### Transactions
- `GET /api/transactions` - Get all transactions (Librarian/Admin only)
- `GET /api/transactions/overdue` - Get overdue transactions (Librarian/Admin only)
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions/issue` - Issue a book (Librarian/Admin only)
- `POST /api/transactions/:id/return` - Return a book (Librarian/Admin only)
- `PUT /api/transactions/:id` - Update transaction (Librarian/Admin only)

### Reservations
- `GET /api/reservations` - Get all reservations (Librarian/Admin only)
- `GET /api/reservations/:id` - Get reservation by ID
- `POST /api/reservations` - Create a reservation
- `POST /api/reservations/:id/fulfill` - Fulfill reservation (Librarian/Admin only)
- `POST /api/reservations/:id/cancel` - Cancel reservation
- `DELETE /api/reservations/:id` - Delete reservation (Librarian/Admin only)

### Fine Payments
- `GET /api/fine-payments` - Get all fine payments (Librarian/Admin only)
- `GET /api/fine-payments/summary` - Get payment summary (Librarian/Admin only)
- `GET /api/fine-payments/:id` - Get payment by ID
- `GET /api/fine-payments/transaction/:transaction_id` - Get payments for a transaction
- `POST /api/fine-payments` - Create fine payment (Librarian/Admin only)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## User Roles

- **admin**: Full access to all endpoints
- **librarian**: Access to most endpoints except user management
- **member**: Limited access (own profile, books, reservations)

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Validation errors if applicable
}
```

## Logging

The application uses Winston for logging. Logs are written to:
- Console (development)
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## Database Connection Pooling

The application uses PostgreSQL connection pooling for efficient database connections. Configuration can be adjusted in `.env`:

- `DB_POOL_MAX`: Maximum number of clients in the pool (default: 20)
- `DB_POOL_IDLE_TIMEOUT`: Close idle clients after this many milliseconds (default: 30000)
- `DB_POOL_CONNECTION_TIMEOUT`: Return error after this many milliseconds if connection cannot be established (default: 2000)

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configured for cross-origin requests
- **Bcrypt**: Password hashing
- **JWT**: Secure token-based authentication
- **express-validator**: Input validation and sanitization

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run database seed script
npm run seed

# Initialize database
npm run init-db
```

## Production

1. Set `NODE_ENV=production` in `.env`
2. Use strong, unique values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `SESSION_SECRET`
3. Enable SSL for database connections if required
4. Configure proper CORS origins
5. Set up process management (PM2, Docker, etc.)
6. Enable HTTPS

## License

ISC

