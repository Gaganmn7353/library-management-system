-- =====================================================
-- Library Management System - PostgreSQL Database Schema
-- =====================================================

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS fine_payments CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- Table: users
-- Description: Stores user accounts (admin, librarian, member)
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'librarian', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: books
-- Description: Stores book information and inventory
-- =====================================================
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    publisher VARCHAR(255),
    publication_year INTEGER CHECK (publication_year >= 1000 AND publication_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    category VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    description TEXT,
    cover_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_available_quantity CHECK (available_quantity <= quantity)
);

-- =====================================================
-- Table: members
-- Description: Stores member information linked to users
-- =====================================================
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    member_id VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
    membership_expiry DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT check_membership_expiry CHECK (membership_expiry >= membership_date)
);

-- =====================================================
-- Table: transactions
-- Description: Stores book issue and return transactions
-- =====================================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (fine_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue')),
    CONSTRAINT check_due_date CHECK (due_date >= issue_date),
    CONSTRAINT check_return_date CHECK (return_date IS NULL OR return_date >= issue_date)
);

-- =====================================================
-- Table: reservations
-- Description: Stores book reservations by members
-- =====================================================
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    reservation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    CONSTRAINT unique_active_reservation UNIQUE (member_id, book_id, status) 
        DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- Table: fine_payments
-- Description: Stores fine payment records
-- =====================================================
CREATE TABLE fine_payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'online', 'other'))
);

-- =====================================================
-- Indexes for Foreign Keys
-- =====================================================

-- Indexes on foreign key columns for better join performance
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_book_id ON transactions(book_id);
CREATE INDEX idx_reservations_member_id ON reservations(member_id);
CREATE INDEX idx_reservations_book_id ON reservations(book_id);
CREATE INDEX idx_fine_payments_transaction_id ON fine_payments(transaction_id);

-- =====================================================
-- Indexes for Frequently Queried Columns
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);

-- Books table indexes
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_available_quantity ON books(available_quantity);

-- Members table indexes
CREATE INDEX idx_members_member_id ON members(member_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_membership_expiry ON members(membership_expiry);

-- Transactions table indexes
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_issue_date ON transactions(issue_date);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_transactions_return_date ON transactions(return_date);
CREATE INDEX idx_transactions_member_book ON transactions(member_id, book_id);

-- Reservations table indexes
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_reservation_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_member_status ON reservations(member_id, status);

-- Fine payments table indexes
CREATE INDEX idx_fine_payments_payment_date ON fine_payments(payment_date);

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for books table
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Functions and Triggers for Business Logic
-- =====================================================

-- Function to automatically update transaction status to 'overdue'
CREATE OR REPLACE FUNCTION update_overdue_transactions()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE transactions
    SET status = 'overdue'
    WHERE status = 'issued' 
      AND due_date < CURRENT_DATE
      AND return_date IS NULL;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for overdue transactions (runs daily via cron or application)
-- Note: This is a placeholder. In production, use a scheduled job or application-level check

-- Function to update book available_quantity when transaction is created/updated
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease available quantity when book is issued
        UPDATE books
        SET available_quantity = available_quantity - 1
        WHERE id = NEW.book_id AND available_quantity > 0;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If status changed from 'issued' to 'returned', increase available quantity
        IF OLD.status = 'issued' AND NEW.status = 'returned' AND NEW.return_date IS NOT NULL THEN
            UPDATE books
            SET available_quantity = available_quantity + 1
            WHERE id = NEW.book_id;
        -- If status changed from 'returned' back to 'issued' (shouldn't happen, but handle it)
        ELSIF OLD.status = 'returned' AND NEW.status = 'issued' THEN
            UPDATE books
            SET available_quantity = available_quantity - 1
            WHERE id = NEW.book_id AND available_quantity > 0;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update book availability
CREATE TRIGGER trigger_update_book_availability
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_book_availability();

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View: Active members with user information
CREATE OR REPLACE VIEW active_members_view AS
SELECT 
    m.id,
    m.member_id,
    u.username,
    u.email,
    m.phone,
    m.address,
    m.membership_date,
    m.membership_expiry,
    m.status
FROM members m
JOIN users u ON m.user_id = u.id
WHERE m.status = 'active';

-- View: Books with availability status
CREATE OR REPLACE VIEW books_availability_view AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.isbn,
    b.category,
    b.quantity,
    b.available_quantity,
    (b.quantity - b.available_quantity) AS borrowed_count,
    CASE 
        WHEN b.available_quantity > 0 THEN 'available'
        ELSE 'unavailable'
    END AS availability_status
FROM books b;

-- View: Current transactions with member and book details
CREATE OR REPLACE VIEW current_transactions_view AS
SELECT 
    t.id,
    t.issue_date,
    t.due_date,
    t.return_date,
    t.fine_amount,
    t.status,
    m.member_id,
    u.username AS member_name,
    u.email AS member_email,
    b.title AS book_title,
    b.author AS book_author,
    b.isbn AS book_isbn,
    CASE 
        WHEN t.status = 'issued' AND t.due_date < CURRENT_DATE THEN 
            EXTRACT(DAY FROM CURRENT_DATE - t.due_date)::INTEGER
        ELSE 0
    END AS days_overdue
FROM transactions t
JOIN members m ON t.member_id = m.id
JOIN users u ON m.user_id = u.id
JOIN books b ON t.book_id = b.id
WHERE t.status IN ('issued', 'overdue');

-- View: Member transaction summary
CREATE OR REPLACE VIEW member_transaction_summary AS
SELECT 
    m.id AS member_id,
    m.member_id AS member_code,
    u.username,
    COUNT(t.id) AS total_transactions,
    COUNT(CASE WHEN t.status = 'issued' THEN 1 END) AS active_issues,
    COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) AS overdue_count,
    COALESCE(SUM(t.fine_amount), 0) AS total_fines,
    COALESCE(SUM(CASE WHEN t.status IN ('issued', 'overdue') THEN t.fine_amount ELSE 0 END), 0) AS pending_fines
FROM members m
JOIN users u ON m.user_id = u.id
LEFT JOIN transactions t ON m.id = t.member_id
GROUP BY m.id, m.member_id, u.username;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE users IS 'Stores user accounts for admin, librarian, and member roles';
COMMENT ON TABLE books IS 'Stores book catalog information and inventory counts';
COMMENT ON TABLE members IS 'Stores member profiles linked to user accounts';
COMMENT ON TABLE transactions IS 'Stores book issue and return transaction records';
COMMENT ON TABLE reservations IS 'Stores book reservation requests by members';
COMMENT ON TABLE fine_payments IS 'Stores fine payment transaction records';

COMMENT ON COLUMN users.role IS 'User role: admin, librarian, or member';
COMMENT ON COLUMN books.quantity IS 'Total number of copies of the book';
COMMENT ON COLUMN books.available_quantity IS 'Number of copies currently available for issue';
COMMENT ON COLUMN members.status IS 'Member account status: active, inactive, or suspended';
COMMENT ON COLUMN transactions.status IS 'Transaction status: issued, returned, or overdue';
COMMENT ON COLUMN transactions.fine_amount IS 'Fine amount in currency (e.g., USD)';
COMMENT ON COLUMN reservations.status IS 'Reservation status: pending, fulfilled, or cancelled';

