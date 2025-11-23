# Library Management System

A comprehensive Library Management System built with Node.js/Express backend, React frontend, and SQLite database. Features modern UI with dark/light mode, advanced search, fine calculation, and comprehensive reporting.

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **SQLite** database
- **bcrypt** for password hashing
- **express-session** for authentication

### Frontend
- **React** with **Vite**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** with **Zod** for form validation
- **Recharts** for data visualization
- **React Hot Toast** for notifications
- **React Icons** for icons

## Features

### 📚 Book Management
- Add, edit, delete books
- Search books by title, author, ISBN, or subject
- Filter by category and publication year
- Sort by title, author, year, or popularity
- View book availability status
- Pagination support

### 👥 Member Management
- Register new members (students, faculty, public)
- Update member information
- Search and filter members
- View member transaction history
- Active/inactive status management

### 📖 Transaction Management
- Issue books to members
- Return books with automatic fine calculation
- Track overdue books
- Calculate fines ($2 per day after due date, 1-day grace period, max $50)
- Pay fines and mark as paid
- View transaction history

### 📊 Reports & Analytics
- Dashboard with key statistics
- Popular books chart
- Monthly issue/return trends
- Category distribution
- Member activity by type
- Overdue books summary
- Fine collection reports

### 🎨 User Interface
- Modern, responsive design
- Dark/Light mode toggle
- Glassmorphism effects
- Smooth animations and transitions
- Mobile-friendly
- Gradient accents (indigo/purple theme)

### 🔒 Authentication
- Librarian login system
- Session-based authentication
- Protected routes
- Role-based access control (admin/librarian)

## Project Structure

```
lms/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── members.js
│   │   ├── transactions.js
│   │   └── reports.js
│   ├── middleware/
│   │   └── auth.js
│   ├── db.js
│   ├── server.js
│   ├── init-db.js
│   ├── seed.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start (Windows)

1. **Navigate to the project directory:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"
```

2. **Install all dependencies:**
```bash
npm run install:all
```

3. **Initialize and seed the database:**
```bash
npm run init:db
npm run seed:db
```

4. **Start both servers:**
   - Option A: Use the batch file (easiest):
     ```bash
     start.bat
     ```
   - Option B: Use PowerShell script:
     ```powershell
     .\start.ps1
     ```
   - Option C: Start manually in two separate terminals:
     - Terminal 1: `npm run start:backend`
     - Terminal 2: `npm run start:frontend`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd lms/backend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Start the backend server:
```bash
npm start
```

The backend server will run on `http://localhost:5000`

### Exporting the Database to CSV

1. Make sure the database has been initialized/seeded (steps above).
2. From `lms/backend`, run:
   ```bash
   node export-csv.js
   ```
3. CSV files for `books`, `members`, `transactions`, and `librarians` will be generated in `lms/backend/exports/`.

### Exporting the Database to SQL

1. Ensure the database exists and contains the data you want to export.
2. From `lms/backend`, run:
   ```bash
   node export-sql.js
   ```
3. A complete dump (schema + data) will be saved to `lms/backend/exports/library.sql`.
4. To rebuild another SQLite database from that dump:
   ```bash
   sqlite3 new-library.db < exports/library.sql
   ```
   (Use any SQLite client you like; the dump contains `DROP TABLE` + `CREATE TABLE` + `INSERT` statements, so it will recreate the schema and data exactly.)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd lms/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Login Credentials

### Admin Librarian
- **Username:** `admin`
- **Password:** `admin123`

### Regular Librarian
- **Username:** `librarian`
- **Password:** `librarian123`

## Database Schema

### Books Table
- `id` - Primary key
- `isbn` - Unique ISBN number
- `title` - Book title
- `author` - Author name
- `subject` - Category/subject
- `publisher` - Publisher name
- `publication_year` - Year of publication
- `total_copies` - Total number of copies
- `available_copies` - Available copies
- `shelf_location` - Physical shelf location

### Members Table
- `id` - Primary key
- `member_id` - Unique member ID
- `name` - Member name
- `email` - Email address
- `phone` - Phone number
- `member_type` - student/faculty/public
- `registration_date` - Registration date
- `status` - active/inactive

### Transactions Table
- `id` - Primary key
- `book_id` - Foreign key to books
- `member_id` - Foreign key to members
- `issue_date` - Issue date
- `due_date` - Due date
- `return_date` - Return date
- `fine_amount` - Calculated fine
- `status` - issued/returned/overdue
- `paid` - Fine payment status

### Librarians Table
- `id` - Primary key
- `username` - Unique username
- `password_hash` - Hashed password
- `name` - Librarian name
- `email` - Email address
- `role` - admin/librarian

## API Endpoints

### Authentication
- `POST /api/auth/login` - Librarian login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify session

### Books
- `GET /api/books` - Get all books (with pagination, search, filters)
- `GET /api/books/:id` - Get book by ID
- `GET /api/books/search` - Search books
- `POST /api/books` - Add new book (librarian only)
- `PUT /api/books/:id` - Update book (librarian only)
- `DELETE /api/books/:id` - Delete book (librarian only)

### Members
- `GET /api/members` - Get all members (with pagination, search)
- `GET /api/members/:id` - Get member by ID
- `POST /api/members` - Register new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member (librarian only)

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/overdue` - Get overdue books
- `GET /api/transactions/member/:memberId` - Get member transactions
- `POST /api/transactions/issue` - Issue a book
- `PUT /api/transactions/:id/return` - Return a book
- `PUT /api/transactions/:id/pay` - Pay fine

### Reports
- `GET /api/reports/popular-books` - Most issued books
- `GET /api/reports/overdue-summary` - Overdue summary
- `GET /api/reports/member-activity` - Member activity statistics
- `GET /api/reports/monthly-trends` - Monthly issue/return trends
- `GET /api/reports/category-distribution` - Books by category
- `GET /api/reports/fine-collection` - Fine collection over time

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

## Sample Data

The seed script generates:
- **100 books** across 8 categories (Fiction, Non-Fiction, Computer Science, Mathematics, Physics, Chemistry, Biology, Business)
- **30 members** (20 students, 7 faculty, 3 public)
- **50 transactions** (30 returned, 15 currently issued, 5 recently issued)
- **2 librarian accounts** (admin and regular)

## Fine Calculation

- **Loan Period:** 14 days
- **Grace Period:** 1 day
- **Fine Rate:** $2 per day after grace period
- **Maximum Fine:** $50 per book
- Fines are calculated automatically when books are returned

## Development

### Backend Development
```bash
cd lms/backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd lms/frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production

#### Backend
```bash
cd lms/backend
npm start
```

#### Frontend
```bash
cd lms/frontend
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

## Features in Detail

### Advanced Search
- Real-time search with 300ms debouncing
- Multi-field search (title, author, ISBN, subject)
- Filter by category, publication year, availability
- Sort by title, author, year, popularity
- Search suggestions dropdown
- Highlight search terms in results

### Fine Management
- Automatic fine calculation
- Visual indicators for overdue books
- Grace period before fines start
- Maximum fine cap ($50)
- Fine payment interface
- Fine receipt generation
- Overdue report generation

### Reports & Analytics
- Dashboard statistics cards
- Monthly issue/return trends (line chart)
- Most popular books (bar chart)
- Category distribution (pie chart)
- Member activity by type (bar chart)
- Fine collection over time
- Export functionality (CSV)
- Date range selection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on the repository.

## Screenshots

*(Add screenshots of the application here)*

## Future Enhancements

- [ ] Email notifications for overdue books
- [ ] Book reservations system
- [ ] Advanced reporting with PDF export
- [ ] Multi-library support
- [ ] Barcode scanning
- [ ] Mobile app
- [ ] Book recommendations
- [ ] Reading history
- [ ] Book reviews and ratings

## Acknowledgments

- Built with modern web technologies
- Inspired by real-world library management systems
- Designed for ease of use and scalability