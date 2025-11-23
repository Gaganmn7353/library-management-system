-- =====================================================
-- Library Management System - Sample Data Initialization
-- =====================================================
-- This file contains sample data for testing and development
-- Run this after creating the schema using schema.sql
-- =====================================================

-- =====================================================
-- Sample Users
-- =====================================================
-- Password hashes are for demonstration only (password: "password123")
-- In production, use proper password hashing (bcrypt, argon2, etc.)
INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES
-- Admin users
('admin', 'admin@library.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'admin', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('librarian1', 'librarian1@library.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'librarian', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('librarian2', 'librarian2@library.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'librarian', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),

-- Member users
('john_doe', 'john.doe@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-01-15 09:00:00+00', '2023-01-15 09:00:00+00'),
('jane_smith', 'jane.smith@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-02-01 09:00:00+00', '2023-02-01 09:00:00+00'),
('bob_wilson', 'bob.wilson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-02-15 09:00:00+00', '2023-02-15 09:00:00+00'),
('alice_brown', 'alice.brown@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-03-01 09:00:00+00', '2023-03-01 09:00:00+00'),
('charlie_davis', 'charlie.davis@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-03-15 09:00:00+00', '2023-03-15 09:00:00+00'),
('diana_miller', 'diana.miller@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-04-01 09:00:00+00', '2023-04-01 09:00:00+00'),
('edward_jones', 'edward.jones@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-04-15 09:00:00+00', '2023-04-15 09:00:00+00'),
('fiona_taylor', 'fiona.taylor@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-05-01 09:00:00+00', '2023-05-01 09:00:00+00'),
('george_anderson', 'george.anderson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-05-15 09:00:00+00', '2023-05-15 09:00:00+00'),
('helen_thomas', 'helen.thomas@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'member', '2023-06-01 09:00:00+00', '2023-06-01 09:00:00+00');

-- =====================================================
-- Sample Books
-- =====================================================
INSERT INTO books (title, author, isbn, publisher, publication_year, category, quantity, available_quantity, description, cover_image_url, created_at, updated_at) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Scribner', 1925, 'Fiction', 5, 3, 'A classic American novel about the Jazz Age and the American Dream.', 'https://example.com/covers/great-gatsby.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'J.B. Lippincott & Co.', 1960, 'Fiction', 4, 2, 'A gripping tale of racial injustice and childhood innocence.', 'https://example.com/covers/mockingbird.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('1984', 'George Orwell', '978-0-452-28423-4', 'Secker & Warburg', 1949, 'Dystopian Fiction', 6, 4, 'A dystopian social science fiction novel about totalitarian control.', 'https://example.com/covers/1984.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 'T. Egerton', 1813, 'Romance', 5, 5, 'A romantic novel of manners about Elizabeth Bennet and Mr. Darcy.', 'https://example.com/covers/pride-prejudice.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('The Catcher in the Rye', 'J.D. Salinger', '978-0-316-76948-0', 'Little, Brown and Company', 1951, 'Fiction', 3, 1, 'A controversial novel about teenage rebellion and alienation.', 'https://example.com/covers/catcher-rye.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('Lord of the Flies', 'William Golding', '978-0-571-05686-5', 'Faber and Faber', 1954, 'Fiction', 4, 3, 'A story about a group of boys stranded on an uninhabited island.', 'https://example.com/covers/lord-flies.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('The Hobbit', 'J.R.R. Tolkien', '978-0-547-92822-7', 'George Allen & Unwin', 1937, 'Fantasy', 5, 4, 'A fantasy novel about Bilbo Baggins and his unexpected journey.', 'https://example.com/covers/hobbit.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', '978-0-7475-3269-6', 'Bloomsbury', 1997, 'Fantasy', 8, 6, 'The first book in the Harry Potter series.', 'https://example.com/covers/hp1.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('The Da Vinci Code', 'Dan Brown', '978-0-385-50420-5', 'Doubleday', 2003, 'Mystery', 6, 5, 'A mystery thriller novel about a murder in the Louvre Museum.', 'https://example.com/covers/davinci-code.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('A Brief History of Time', 'Stephen Hawking', '978-0-553-10953-5', 'Bantam Books', 1988, 'Science', 4, 3, 'A popular science book about cosmology and theoretical physics.', 'https://example.com/covers/brief-history.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '978-0-06-231609-7', 'Harper', 2014, 'History', 5, 4, 'An exploration of how Homo sapiens conquered the world.', 'https://example.com/covers/sapiens.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 'Prentice Hall', 2008, 'Technology', 3, 2, 'A handbook of agile software craftsmanship.', 'https://example.com/covers/clean-code.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('Design Patterns', 'Gang of Four', '978-0-201-63361-0', 'Addison-Wesley', 1994, 'Technology', 4, 3, 'Elements of Reusable Object-Oriented Software.', 'https://example.com/covers/design-patterns.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('The Art of Computer Programming', 'Donald Knuth', '978-0-201-03804-0', 'Addison-Wesley', 1968, 'Technology', 2, 1, 'A comprehensive monograph about computer programming.', 'https://example.com/covers/taocp.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00'),
('Introduction to Algorithms', 'CLRS', '978-0-262-03384-8', 'MIT Press', 2009, 'Technology', 5, 4, 'A comprehensive introduction to algorithms and data structures.', 'https://example.com/covers/algorithms.jpg', '2023-01-01 10:00:00+00', '2023-01-01 10:00:00+00');

-- =====================================================
-- Sample Members
-- =====================================================
INSERT INTO members (user_id, member_id, phone, address, membership_date, membership_expiry, status) VALUES
(4, 'MEM001', '555-0101', '123 Main Street, City, State 12345', '2023-01-15', '2024-01-15', 'active'),
(5, 'MEM002', '555-0102', '456 Oak Avenue, City, State 12345', '2023-02-01', '2024-02-01', 'active'),
(6, 'MEM003', '555-0103', '789 Pine Road, City, State 12345', '2023-02-15', '2024-02-15', 'active'),
(7, 'MEM004', '555-0104', '321 Elm Street, City, State 12345', '2023-03-01', '2024-03-01', 'active'),
(8, 'MEM005', '555-0105', '654 Maple Drive, City, State 12345', '2023-03-15', '2024-03-15', 'active'),
(9, 'MEM006', '555-0106', '987 Cedar Lane, City, State 12345', '2023-04-01', '2024-04-01', 'active'),
(10, 'MEM007', '555-0107', '147 Birch Boulevard, City, State 12345', '2023-04-15', '2024-04-15', 'active'),
(11, 'MEM008', '555-0108', '258 Spruce Court, City, State 12345', '2023-05-01', '2024-05-01', 'active'),
(12, 'MEM009', '555-0109', '369 Willow Way, City, State 12345', '2023-05-15', '2024-05-15', 'active'),
(13, 'MEM010', '555-0110', '741 Ash Street, City, State 12345', '2023-06-01', '2024-06-01', 'inactive');

-- =====================================================
-- Sample Transactions
-- =====================================================
INSERT INTO transactions (member_id, book_id, issue_date, due_date, return_date, fine_amount, status) VALUES
-- Active transactions (issued)
(1, 1, '2024-01-10', '2024-01-24', NULL, 0.00, 'issued'),
(1, 2, '2024-01-15', '2024-01-29', NULL, 0.00, 'issued'),
(2, 3, '2024-01-12', '2024-01-26', NULL, 0.00, 'issued'),
(3, 4, '2024-01-08', '2024-01-22', NULL, 0.00, 'issued'),
(4, 5, '2024-01-05', '2024-01-19', NULL, 0.00, 'issued'),

-- Overdue transactions
(5, 6, '2023-12-20', '2024-01-03', NULL, 5.50, 'overdue'),
(6, 7, '2023-12-15', '2023-12-29', NULL, 8.00, 'overdue'),

-- Returned transactions
(1, 8, '2023-12-01', '2023-12-15', '2023-12-14', 0.00, 'returned'),
(2, 9, '2023-12-05', '2023-12-19', '2023-12-18', 0.00, 'returned'),
(3, 10, '2023-12-10', '2023-12-24', '2023-12-23', 0.00, 'returned'),
(4, 11, '2023-11-20', '2023-12-04', '2023-12-05', 0.50, 'returned'),
(5, 12, '2023-11-15', '2023-11-29', '2023-11-30', 0.50, 'returned'),
(6, 13, '2023-11-10', '2023-11-24', '2023-11-25', 0.50, 'returned'),
(7, 14, '2023-10-20', '2023-11-03', '2023-11-02', 0.00, 'returned'),
(8, 15, '2023-10-15', '2023-10-29', '2023-10-28', 0.00, 'returned');

-- =====================================================
-- Sample Reservations
-- =====================================================
INSERT INTO reservations (member_id, book_id, reservation_date, status) VALUES
(2, 1, '2024-01-20 10:00:00+00', 'pending'),
(3, 2, '2024-01-18 14:30:00+00', 'pending'),
(4, 3, '2024-01-15 09:15:00+00', 'pending'),
(5, 8, '2024-01-10 11:00:00+00', 'fulfilled'),
(6, 9, '2024-01-08 16:45:00+00', 'fulfilled'),
(7, 10, '2023-12-20 10:00:00+00', 'cancelled');

-- =====================================================
-- Sample Fine Payments
-- =====================================================
INSERT INTO fine_payments (transaction_id, amount, payment_date, payment_method) VALUES
(11, 0.50, '2023-12-05 15:30:00+00', 'cash'),
(12, 0.50, '2023-12-01 10:15:00+00', 'card'),
(13, 0.50, '2023-11-26 14:20:00+00', 'online'),
(14, 0.50, '2023-12-06 09:00:00+00', 'cash');

-- =====================================================
-- Verify Data
-- =====================================================
-- Uncomment the following queries to verify the data was inserted correctly

-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as book_count FROM books;
-- SELECT COUNT(*) as member_count FROM members;
-- SELECT COUNT(*) as transaction_count FROM transactions;
-- SELECT COUNT(*) as reservation_count FROM reservations;
-- SELECT COUNT(*) as fine_payment_count FROM fine_payments;

-- SELECT role, COUNT(*) as count FROM users GROUP BY role;
-- SELECT status, COUNT(*) as count FROM members GROUP BY status;
-- SELECT status, COUNT(*) as count FROM transactions GROUP BY status;
-- SELECT status, COUNT(*) as count FROM reservations GROUP BY status;

