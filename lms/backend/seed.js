import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'library.db');

const db = new sqlite3.Database(dbPath);

const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

// Book data
const booksData = [
  // Fiction (20 books)
  { isbn: '9780143127741', title: 'To Kill a Mockingbird', author: 'Harper Lee', subject: 'Fiction', publisher: 'Penguin Books', year: 2015, copies: 3, shelf: 'F-101' },
  { isbn: '9781982137274', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', subject: 'Fiction', publisher: 'Scribner', year: 2021, copies: 3, shelf: 'F-102' },
  { isbn: '9780141439563', title: 'Pride and Prejudice', author: 'Jane Austen', subject: 'Fiction', publisher: 'Penguin Classics', year: 2012, copies: 2, shelf: 'F-103' },
  { isbn: '9780061120084', title: '1984', author: 'George Orwell', subject: 'Fiction', publisher: 'HarperCollins', year: 2021, copies: 4, shelf: 'F-104' },
  { isbn: '9780140283334', title: 'Animal Farm', author: 'George Orwell', subject: 'Fiction', publisher: 'Penguin Books', year: 2020, copies: 3, shelf: 'F-105' },
  { isbn: '9780307277671', title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', subject: 'Fiction', publisher: 'Vintage', year: 2011, copies: 3, shelf: 'F-201' },
  { isbn: '9780307743664', title: 'Gone Girl', author: 'Gillian Flynn', subject: 'Fiction', publisher: 'Broadway Books', year: 2014, copies: 3, shelf: 'F-202' },
  { isbn: '9780385349570', title: 'The Silent Patient', author: 'Alex Michaelides', subject: 'Fiction', publisher: 'Celadon Books', year: 2019, copies: 2, shelf: 'F-203' },
  { isbn: '9780525559474', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', subject: 'Fiction', publisher: 'Atria Books', year: 2021, copies: 2, shelf: 'F-204' },
  { isbn: '9780593296145', title: 'Project Hail Mary', author: 'Andy Weir', subject: 'Fiction', publisher: 'Ballantine Books', year: 2021, copies: 3, shelf: 'F-205' },
  { isbn: '9780593099327', title: 'The Midnight Library', author: 'Matt Haig', subject: 'Fiction', publisher: 'Viking', year: 2020, copies: 3, shelf: 'F-301' },
  { isbn: '9780593356154', title: 'It Ends with Us', author: 'Colleen Hoover', subject: 'Fiction', publisher: 'Atria Books', year: 2021, copies: 4, shelf: 'F-302' },
  { isbn: '9780385544241', title: 'The Dutch House', author: 'Ann Patchett', subject: 'Fiction', publisher: 'Harper', year: 2019, copies: 2, shelf: 'F-303' },
  { isbn: '9780593087393', title: 'Where the Crawdads Sing', author: 'Delia Owens', subject: 'Fiction', publisher: 'G.P. Putnam\'s Sons', year: 2021, copies: 3, shelf: 'F-304' },
  { isbn: '9780385494248', title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', subject: 'Fiction', publisher: 'Anchor', year: 2017, copies: 3, shelf: 'F-305' },
  { isbn: '9780062457714', title: 'The Alchemist', author: 'Paulo Coelho', subject: 'Fiction', publisher: 'HarperOne', year: 2014, copies: 4, shelf: 'F-401' },
  { isbn: '9780143127742', title: 'The Catcher in the Rye', author: 'J.D. Salinger', subject: 'Fiction', publisher: 'Little, Brown and Company', year: 2018, copies: 2, shelf: 'F-402' },
  { isbn: '9780307588371', title: 'The Help', author: 'Kathryn Stockett', subject: 'Fiction', publisher: 'Berkley', year: 2011, copies: 3, shelf: 'F-403' },
  { isbn: '9780385537854', title: 'The Goldfinch', author: 'Donna Tartt', subject: 'Fiction', publisher: 'Little, Brown and Company', year: 2014, copies: 2, shelf: 'F-404' },
  { isbn: '9780525559475', title: 'Normal People', author: 'Sally Rooney', subject: 'Fiction', publisher: 'Hogarth', year: 2020, copies: 3, shelf: 'F-405' },

  // Non-Fiction (20 books)
  { isbn: '9780679760801', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', subject: 'Non-Fiction', publisher: 'Harper Perennial', year: 2015, copies: 4, shelf: 'NF-101' },
  { isbn: '9781501127625', title: 'Educated', author: 'Tara Westover', subject: 'Non-Fiction', publisher: 'Random House', year: 2018, copies: 3, shelf: 'NF-102' },
  { isbn: '9780671027032', title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', subject: 'Non-Fiction', publisher: 'Broadway Books', year: 2011, copies: 2, shelf: 'NF-103' },
  { isbn: '9780307278784', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', subject: 'Non-Fiction', publisher: 'Farrar, Straus and Giroux', year: 2013, copies: 3, shelf: 'NF-104' },
  { isbn: '9780143127743', title: 'The Power of Now', author: 'Eckhart Tolle', subject: 'Non-Fiction', publisher: 'New World Library', year: 2010, copies: 4, shelf: 'NF-105' },
  { isbn: '9780062457715', title: 'Becoming', author: 'Michelle Obama', subject: 'Non-Fiction', publisher: 'Crown', year: 2018, copies: 3, shelf: 'NF-201' },
  { isbn: '9780735211292', title: 'Atomic Habits', author: 'James Clear', subject: 'Non-Fiction', publisher: 'Avery', year: 2018, copies: 5, shelf: 'NF-202' },
  { isbn: '9780143127744', title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', subject: 'Non-Fiction', publisher: 'Free Press', year: 2020, copies: 3, shelf: 'NF-203' },
  { isbn: '9780525559476', title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', subject: 'Non-Fiction', publisher: 'Penguin Books', year: 2015, copies: 2, shelf: 'NF-204' },
  { isbn: '9780593099328', title: 'Born a Crime', author: 'Trevor Noah', subject: 'Non-Fiction', publisher: 'Spiegel & Grau', year: 2019, copies: 3, shelf: 'NF-205' },
  { isbn: '9780385494249', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', subject: 'Non-Fiction', publisher: 'W.W. Norton & Company', year: 2017, copies: 2, shelf: 'NF-301' },
  { isbn: '9780062457716', title: 'The Warmth of Other Suns', author: 'Isabel Wilkerson', subject: 'Non-Fiction', publisher: 'Vintage', year: 2011, copies: 2, shelf: 'NF-302' },
  { isbn: '9780307278791', title: 'Outliers: The Story of Success', author: 'Malcolm Gladwell', subject: 'Non-Fiction', publisher: 'Little, Brown and Company', year: 2011, copies: 3, shelf: 'NF-303' },
  { isbn: '9780143127745', title: 'The Devil in the White City', author: 'Erik Larson', subject: 'Non-Fiction', publisher: 'Vintage', year: 2004, copies: 2, shelf: 'NF-304' },
  { isbn: '9780525559477', title: 'Bad Blood: Secrets and Lies in a Silicon Valley Startup', author: 'John Carreyrou', subject: 'Non-Fiction', publisher: 'Knopf', year: 2018, copies: 2, shelf: 'NF-305' },
  { isbn: '9780593099329', title: 'Shoe Dog', author: 'Phil Knight', subject: 'Non-Fiction', publisher: 'Scribner', year: 2016, copies: 3, shelf: 'NF-401' },
  { isbn: '9780385494250', title: 'The Wright Brothers', author: 'David McCullough', subject: 'Non-Fiction', publisher: 'Simon & Schuster', year: 2016, copies: 2, shelf: 'NF-402' },
  { isbn: '9780062457717', title: 'Hillbilly Elegy', author: 'J.D. Vance', subject: 'Non-Fiction', publisher: 'Harper', year: 2018, copies: 2, shelf: 'NF-403' },
  { isbn: '9780307278804', title: 'The Hidden Life of Trees', author: 'Peter Wohlleben', subject: 'Non-Fiction', publisher: 'Greystone Books', year: 2016, copies: 2, shelf: 'NF-404' },
  { isbn: '9780143127746', title: 'Sapiens: A Graphic History', author: 'Yuval Noah Harari', subject: 'Non-Fiction', publisher: 'Harper Perennial', year: 2020, copies: 3, shelf: 'NF-405' },

  // Computer Science (15 books)
  { isbn: '9780134685991', title: 'Effective Java', author: 'Joshua Bloch', subject: 'Computer Science', publisher: 'Addison-Wesley', year: 2018, copies: 3, shelf: 'CS-101' },
  { isbn: '9780134685992', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', subject: 'Computer Science', publisher: 'Prentice Hall', year: 2008, copies: 4, shelf: 'CS-102' },
  { isbn: '9780134685993', title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Gang of Four', subject: 'Computer Science', publisher: 'Addison-Wesley', year: 1994, copies: 2, shelf: 'CS-103' },
  { isbn: '9780134685994', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', subject: 'Computer Science', publisher: 'MIT Press', year: 2022, copies: 3, shelf: 'CS-104' },
  { isbn: '9780134685995', title: 'You Don\'t Know JS', author: 'Kyle Simpson', subject: 'Computer Science', publisher: 'O\'Reilly Media', year: 2020, copies: 3, shelf: 'CS-105' },
  { isbn: '9780134685996', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', subject: 'Computer Science', publisher: 'Prentice Hall', year: 2020, copies: 2, shelf: 'CS-201' },
  { isbn: '9780134685997', title: 'Deep Learning', author: 'Ian Goodfellow', subject: 'Computer Science', publisher: 'MIT Press', year: 2016, copies: 2, shelf: 'CS-202' },
  { isbn: '9780134685998', title: 'Database System Concepts', author: 'Abraham Silberschatz', subject: 'Computer Science', publisher: 'McGraw-Hill', year: 2019, copies: 3, shelf: 'CS-203' },
  { isbn: '9780134685999', title: 'Learning React: Modern Patterns for Developing React Apps', author: 'Alex Banks', subject: 'Computer Science', publisher: 'O\'Reilly Media', year: 2020, copies: 4, shelf: 'CS-204' },
  { isbn: '9780134686000', title: 'Node.js Design Patterns', author: 'Mario Casciaro', subject: 'Computer Science', publisher: 'Packt Publishing', year: 2020, copies: 3, shelf: 'CS-205' },
  { isbn: '9780134686001', title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', subject: 'Computer Science', publisher: 'No Starch Press', year: 2018, copies: 3, shelf: 'CS-301' },
  { isbn: '9780134686002', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', subject: 'Computer Science', publisher: 'Addison-Wesley', year: 2019, copies: 4, shelf: 'CS-302' },
  { isbn: '9780134686003', title: 'System Design Interview', author: 'Alex Xu', subject: 'Computer Science', publisher: 'Independent', year: 2020, copies: 3, shelf: 'CS-303' },
  { isbn: '9780134686004', title: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', subject: 'Computer Science', publisher: 'CareerCup', year: 2015, copies: 5, shelf: 'CS-304' },
  { isbn: '9780134686005', title: 'Python Crash Course', author: 'Eric Matthes', subject: 'Computer Science', publisher: 'No Starch Press', year: 2019, copies: 4, shelf: 'CS-305' },

  // Mathematics (10 books)
  { isbn: '9780134686006', title: 'Calculus: Early Transcendentals', author: 'James Stewart', subject: 'Mathematics', publisher: 'Cengage Learning', year: 2020, copies: 3, shelf: 'MATH-101' },
  { isbn: '9780134686007', title: 'Linear Algebra Done Right', author: 'Sheldon Axler', subject: 'Mathematics', publisher: 'Springer', year: 2015, copies: 2, shelf: 'MATH-102' },
  { isbn: '9780134686008', title: 'Introduction to Statistical Learning', author: 'Gareth James', subject: 'Mathematics', publisher: 'Springer', year: 2021, copies: 3, shelf: 'MATH-103' },
  { isbn: '9780134686009', title: 'Abstract Algebra', author: 'David S. Dummit', subject: 'Mathematics', publisher: 'Wiley', year: 2004, copies: 2, shelf: 'MATH-104' },
  { isbn: '9780134686010', title: 'Differential Equations and Linear Algebra', author: 'Stephen W. Goode', subject: 'Mathematics', publisher: 'Pearson', year: 2017, copies: 2, shelf: 'MATH-105' },
  { isbn: '9780134686011', title: 'Probability and Statistics', author: 'Morris H. DeGroot', subject: 'Mathematics', publisher: 'Pearson', year: 2012, copies: 3, shelf: 'MATH-201' },
  { isbn: '9780134686012', title: 'Real Analysis', author: 'Walter Rudin', subject: 'Mathematics', publisher: 'McGraw-Hill', year: 1976, copies: 2, shelf: 'MATH-202' },
  { isbn: '9780134686013', title: 'Discrete Mathematics and Its Applications', author: 'Kenneth H. Rosen', subject: 'Mathematics', publisher: 'McGraw-Hill', year: 2018, copies: 3, shelf: 'MATH-203' },
  { isbn: '9780134686014', title: 'Number Theory', author: 'George E. Andrews', subject: 'Mathematics', publisher: 'Dover Publications', year: 1994, copies: 2, shelf: 'MATH-204' },
  { isbn: '9780134686015', title: 'Topology', author: 'James Munkres', subject: 'Mathematics', publisher: 'Prentice Hall', year: 2000, copies: 2, shelf: 'MATH-205' },

  // Physics (10 books)
  { isbn: '9780134686016', title: 'University Physics with Modern Physics', author: 'Hugh D. Young', subject: 'Physics', publisher: 'Pearson', year: 2019, copies: 3, shelf: 'PHY-101' },
  { isbn: '9780134686017', title: 'Introduction to Quantum Mechanics', author: 'David J. Griffiths', subject: 'Physics', publisher: 'Pearson', year: 2018, copies: 2, shelf: 'PHY-102' },
  { isbn: '9780134686018', title: 'Classical Mechanics', author: 'Herbert Goldstein', subject: 'Physics', publisher: 'Addison-Wesley', year: 2002, copies: 2, shelf: 'PHY-103' },
  { isbn: '9780134686019', title: 'Thermodynamics: An Engineering Approach', author: 'Yunus A. Çengel', subject: 'Physics', publisher: 'McGraw-Hill', year: 2018, copies: 3, shelf: 'PHY-104' },
  { isbn: '9780134686020', title: 'Introduction to Electrodynamics', author: 'David J. Griffiths', subject: 'Physics', publisher: 'Pearson', year: 2017, copies: 2, shelf: 'PHY-105' },
  { isbn: '9780134686021', title: 'The Feynman Lectures on Physics', author: 'Richard P. Feynman', subject: 'Physics', publisher: 'Addison-Wesley', year: 2005, copies: 2, shelf: 'PHY-201' },
  { isbn: '9780134686022', title: 'Modern Physics', author: 'Paul A. Tipler', subject: 'Physics', publisher: 'W.H. Freeman', year: 2008, copies: 2, shelf: 'PHY-202' },
  { isbn: '9780134686023', title: 'Statistical Mechanics', author: 'R.K. Pathria', subject: 'Physics', publisher: 'Butterworth-Heinemann', year: 2011, copies: 2, shelf: 'PHY-203' },
  { isbn: '9780134686024', title: 'Optics', author: 'Eugene Hecht', subject: 'Physics', publisher: 'Pearson', year: 2016, copies: 2, shelf: 'PHY-204' },
  { isbn: '9780134686025', title: 'A Brief History of Time', author: 'Stephen Hawking', subject: 'Physics', publisher: 'Bantam', year: 2011, copies: 4, shelf: 'PHY-205' },

  // Chemistry (8 books)
  { isbn: '9780134686026', title: 'Organic Chemistry', author: 'Paula Yurkanis Bruice', subject: 'Chemistry', publisher: 'Pearson', year: 2016, copies: 3, shelf: 'CHEM-101' },
  { isbn: '9780134686027', title: 'Inorganic Chemistry', author: 'Gary L. Miessler', subject: 'Chemistry', publisher: 'Pearson', year: 2013, copies: 2, shelf: 'CHEM-102' },
  { isbn: '9780134686028', title: 'Physical Chemistry', author: 'Peter Atkins', subject: 'Chemistry', publisher: 'Oxford University Press', year: 2017, copies: 2, shelf: 'CHEM-103' },
  { isbn: '9780134686029', title: 'General Chemistry', author: 'Darrell Ebbing', subject: 'Chemistry', publisher: 'Cengage Learning', year: 2016, copies: 3, shelf: 'CHEM-104' },
  { isbn: '9780134686030', title: 'Chemistry: The Central Science', author: 'Theodore L. Brown', subject: 'Chemistry', publisher: 'Pearson', year: 2017, copies: 3, shelf: 'CHEM-105' },
  { isbn: '9780134686031', title: 'Advanced Organic Chemistry', author: 'Francis A. Carey', subject: 'Chemistry', publisher: 'Springer', year: 2007, copies: 2, shelf: 'CHEM-201' },
  { isbn: '9780134686032', title: 'Biochemistry', author: 'Jeremy M. Berg', subject: 'Chemistry', publisher: 'W.H. Freeman', year: 2015, copies: 2, shelf: 'CHEM-202' },
  { isbn: '9780134686033', title: 'Analytical Chemistry', author: 'Douglas A. Skoog', subject: 'Chemistry', publisher: 'Cengage Learning', year: 2017, copies: 2, shelf: 'CHEM-203' },

  // Biology (8 books)
  { isbn: '9780134686034', title: 'Campbell Biology', author: 'Lisa A. Urry', subject: 'Biology', publisher: 'Pearson', year: 2020, copies: 3, shelf: 'BIO-101' },
  { isbn: '9780134686035', title: 'Molecular Biology of the Cell', author: 'Bruce Alberts', subject: 'Biology', publisher: 'Garland Science', year: 2014, copies: 2, shelf: 'BIO-102' },
  { isbn: '9780134686036', title: 'Genetics: Analysis and Principles', author: 'Robert J. Brooker', subject: 'Biology', publisher: 'McGraw-Hill', year: 2017, copies: 2, shelf: 'BIO-103' },
  { isbn: '9780134686037', title: 'Ecology: Concepts and Applications', author: 'Manuel C. Molles', subject: 'Biology', publisher: 'McGraw-Hill', year: 2018, copies: 2, shelf: 'BIO-104' },
  { isbn: '9780134686038', title: 'Human Anatomy & Physiology', author: 'Elaine N. Marieb', subject: 'Biology', publisher: 'Pearson', year: 2018, copies: 3, shelf: 'BIO-105' },
  { isbn: '9780134686039', title: 'The Selfish Gene', author: 'Richard Dawkins', subject: 'Biology', publisher: 'Oxford University Press', year: 2016, copies: 3, shelf: 'BIO-201' },
  { isbn: '9780134686040', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', subject: 'Biology', publisher: 'Harper Perennial', year: 2015, copies: 2, shelf: 'BIO-202' },
  { isbn: '9780134686041', title: 'The Origin of Species', author: 'Charles Darwin', subject: 'Biology', publisher: 'Penguin Classics', year: 2009, copies: 2, shelf: 'BIO-203' },

  // Business (9 books)
  { isbn: '9780134686042', title: 'Good to Great', author: 'Jim Collins', subject: 'Business', publisher: 'HarperBusiness', year: 2001, copies: 3, shelf: 'BUS-101' },
  { isbn: '9780134686043', title: 'The Lean Startup', author: 'Eric Ries', subject: 'Business', publisher: 'Crown Business', year: 2011, copies: 4, shelf: 'BUS-102' },
  { isbn: '9780134686044', title: 'Principles of Marketing', author: 'Philip Kotler', subject: 'Business', publisher: 'Pearson', year: 2020, copies: 3, shelf: 'BUS-103' },
  { isbn: '9780134686045', title: 'Financial Accounting', author: 'Jerry J. Weygandt', subject: 'Business', publisher: 'Wiley', year: 2018, copies: 3, shelf: 'BUS-104' },
  { isbn: '9780134686046', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', subject: 'Business', publisher: 'Farrar, Straus and Giroux', year: 2013, copies: 2, shelf: 'BUS-105' },
  { isbn: '9780134686047', title: 'The Innovator\'s Dilemma', author: 'Clayton M. Christensen', subject: 'Business', publisher: 'Harvard Business Review Press', year: 2016, copies: 2, shelf: 'BUS-201' },
  { isbn: '9780134686048', title: 'Zero to One', author: 'Peter Thiel', subject: 'Business', publisher: 'Crown Business', year: 2014, copies: 3, shelf: 'BUS-202' },
  { isbn: '9780134686049', title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', subject: 'Business', publisher: 'HarperBusiness', year: 2014, copies: 2, shelf: 'BUS-203' },
  { isbn: '9780134686050', title: 'Principles: Life and Work', author: 'Ray Dalio', subject: 'Business', publisher: 'Simon & Schuster', year: 2017, copies: 2, shelf: 'BUS-204' },
];

// Member data
const membersData = [
  // Students (20)
  { member_id: 'STU001', name: 'John Smith', email: 'john.smith@student.edu', phone: '555-0101', type: 'student', reg_date: '2023-01-15', status: 'active' },
  { member_id: 'STU002', name: 'Sarah Johnson', email: 'sarah.johnson@student.edu', phone: '555-0102', type: 'student', reg_date: '2023-02-20', status: 'active' },
  { member_id: 'STU003', name: 'Michael Brown', email: 'michael.brown@student.edu', phone: '555-0103', type: 'student', reg_date: '2023-03-10', status: 'active' },
  { member_id: 'STU004', name: 'Emily Davis', email: 'emily.davis@student.edu', phone: '555-0104', type: 'student', reg_date: '2023-04-05', status: 'active' },
  { member_id: 'STU005', name: 'David Wilson', email: 'david.wilson@student.edu', phone: '555-0105', type: 'student', reg_date: '2023-05-12', status: 'active' },
  { member_id: 'STU006', name: 'Jessica Martinez', email: 'jessica.martinez@student.edu', phone: '555-0106', type: 'student', reg_date: '2023-06-18', status: 'active' },
  { member_id: 'STU007', name: 'Christopher Lee', email: 'christopher.lee@student.edu', phone: '555-0107', type: 'student', reg_date: '2023-07-22', status: 'active' },
  { member_id: 'STU008', name: 'Ashley Garcia', email: 'ashley.garcia@student.edu', phone: '555-0108', type: 'student', reg_date: '2023-08-30', status: 'active' },
  { member_id: 'STU009', name: 'Matthew Rodriguez', email: 'matthew.rodriguez@student.edu', phone: '555-0109', type: 'student', reg_date: '2023-09-14', status: 'active' },
  { member_id: 'STU010', name: 'Amanda Anderson', email: 'amanda.anderson@student.edu', phone: '555-0110', type: 'student', reg_date: '2023-10-08', status: 'active' },
  { member_id: 'STU011', name: 'James Taylor', email: 'james.taylor@student.edu', phone: '555-0111', type: 'student', reg_date: '2022-11-20', status: 'active' },
  { member_id: 'STU012', name: 'Melissa Thomas', email: 'melissa.thomas@student.edu', phone: '555-0112', type: 'student', reg_date: '2022-12-05', status: 'active' },
  { member_id: 'STU013', name: 'Robert Jackson', email: 'robert.jackson@student.edu', phone: '555-0113', type: 'student', reg_date: '2023-01-25', status: 'inactive' },
  { member_id: 'STU014', name: 'Michelle White', email: 'michelle.white@student.edu', phone: '555-0114', type: 'student', reg_date: '2023-02-14', status: 'active' },
  { member_id: 'STU015', name: 'Daniel Harris', email: 'daniel.harris@student.edu', phone: '555-0115', type: 'student', reg_date: '2023-03-28', status: 'active' },
  { member_id: 'STU016', name: 'Laura Clark', email: 'laura.clark@student.edu', phone: '555-0116', type: 'student', reg_date: '2023-04-16', status: 'active' },
  { member_id: 'STU017', name: 'Kevin Lewis', email: 'kevin.lewis@student.edu', phone: '555-0117', type: 'student', reg_date: '2023-05-09', status: 'active' },
  { member_id: 'STU018', name: 'Nicole Walker', email: 'nicole.walker@student.edu', phone: '555-0118', type: 'student', reg_date: '2023-06-22', status: 'active' },
  { member_id: 'STU019', name: 'Ryan Hall', email: 'ryan.hall@student.edu', phone: '555-0119', type: 'student', reg_date: '2023-07-11', status: 'active' },
  { member_id: 'STU020', name: 'Stephanie Allen', email: 'stephanie.allen@student.edu', phone: '555-0120', type: 'student', reg_date: '2023-08-04', status: 'active' },

  // Faculty (7)
  { member_id: 'FAC001', name: 'Dr. Robert Thompson', email: 'r.thompson@university.edu', phone: '555-0201', type: 'faculty', reg_date: '2022-01-10', status: 'active' },
  { member_id: 'FAC002', name: 'Dr. Patricia Moore', email: 'p.moore@university.edu', phone: '555-0202', type: 'faculty', reg_date: '2022-02-15', status: 'active' },
  { member_id: 'FAC003', name: 'Dr. William Young', email: 'w.young@university.edu', phone: '555-0203', type: 'faculty', reg_date: '2022-03-20', status: 'active' },
  { member_id: 'FAC004', name: 'Dr. Linda King', email: 'l.king@university.edu', phone: '555-0204', type: 'faculty', reg_date: '2022-04-25', status: 'active' },
  { member_id: 'FAC005', name: 'Dr. Richard Wright', email: 'r.wright@university.edu', phone: '555-0205', type: 'faculty', reg_date: '2022-05-30', status: 'active' },
  { member_id: 'FAC006', name: 'Dr. Barbara Scott', email: 'b.scott@university.edu', phone: '555-0206', type: 'faculty', reg_date: '2022-06-10', status: 'active' },
  { member_id: 'FAC007', name: 'Dr. Joseph Green', email: 'j.green@university.edu', phone: '555-0207', type: 'faculty', reg_date: '2022-07-15', status: 'active' },

  // Public (3)
  { member_id: 'PUB001', name: 'Jennifer Adams', email: 'jennifer.adams@email.com', phone: '555-0301', type: 'public', reg_date: '2023-09-01', status: 'active' },
  { member_id: 'PUB002', name: 'Mark Baker', email: 'mark.baker@email.com', phone: '555-0302', type: 'public', reg_date: '2023-10-15', status: 'active' },
  { member_id: 'PUB003', name: 'Lisa Carter', email: 'lisa.carter@email.com', phone: '555-0303', type: 'public', reg_date: '2023-11-20', status: 'active' },
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await dbRun('DELETE FROM transactions');
    await dbRun('DELETE FROM books');
    await dbRun('DELETE FROM members');
    await dbRun('DELETE FROM librarians');

    console.log('Cleared existing data...');

    // Insert books
    console.log('Inserting books...');
    for (const book of booksData) {
      await dbRun(
        `INSERT INTO books (isbn, title, author, subject, publisher, publication_year, total_copies, available_copies, shelf_location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [book.isbn, book.title, book.author, book.subject, book.publisher, book.year, book.copies, book.copies, book.shelf]
      );
    }
    console.log(`Inserted ${booksData.length} books`);

    // Insert members
    console.log('Inserting members...');
    for (const member of membersData) {
      await dbRun(
        `INSERT INTO members (member_id, name, email, phone, member_type, registration_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [member.member_id, member.name, member.email, member.phone, member.type, member.reg_date, member.status]
      );
    }
    console.log(`Inserted ${membersData.length} members`);

    // Insert librarians
    console.log('Inserting librarians...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const librarianHash = await bcrypt.hash('librarian123', 10);

    await dbRun(
      `INSERT INTO librarians (username, password_hash, name, email, role)
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', adminHash, 'Admin Librarian', 'admin@library.edu', 'admin']
    );

    await dbRun(
      `INSERT INTO librarians (username, password_hash, name, email, role)
       VALUES (?, ?, ?, ?, ?)`,
      ['librarian', librarianHash, 'Regular Librarian', 'librarian@library.edu', 'librarian']
    );
    console.log('Inserted 2 librarians');

    // Get inserted books and members for transactions
    const books = await dbAll('SELECT id FROM books');
    const members = await dbAll('SELECT id FROM members');

    // Generate transactions
    console.log('Generating transactions...');
    const today = new Date();
    let transactionCount = 0;

    // 30 returned transactions (some with fines)
    for (let i = 0; i < 30; i++) {
      const book = books[Math.floor(Math.random() * books.length)];
      const member = members[Math.floor(Math.random() * members.length)];
      const issueDate = new Date(today);
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 60) - 14);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);
      const returnDate = new Date(dueDate);
      returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 10) - 2); // -2 to +8 days

      let fineAmount = 0;
      let status = 'returned';
      if (returnDate > dueDate) {
        const daysLate = Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = Math.min(daysLate * 2, 50); // $2 per day, max $50
      }

      await dbRun(
        `INSERT INTO transactions (book_id, member_id, issue_date, due_date, return_date, fine_amount, status, paid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [book.id, member.id, issueDate.toISOString().split('T')[0], dueDate.toISOString().split('T')[0],
         returnDate.toISOString().split('T')[0], fineAmount, status, fineAmount > 0 ? (Math.random() > 0.5 ? 1 : 0) : 1]
      );
      transactionCount++;
    }

    // 15 currently issued (some overdue)
    for (let i = 0; i < 15; i++) {
      const book = books[Math.floor(Math.random() * books.length)];
      const member = members[Math.floor(Math.random() * members.length)];
      const issueDate = new Date(today);
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 20));
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);

      let fineAmount = 0;
      let status = 'issued';
      if (today > dueDate) {
        const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = Math.min(daysLate * 2, 50);
        status = 'overdue';
      }

      await dbRun(
        `INSERT INTO transactions (book_id, member_id, issue_date, due_date, fine_amount, status, paid)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [book.id, member.id, issueDate.toISOString().split('T')[0], dueDate.toISOString().split('T')[0],
         fineAmount, status, 0]
      );

      // Update available copies
      await dbRun('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book.id]);
      transactionCount++;
    }

    // 5 recently issued
    for (let i = 0; i < 5; i++) {
      const book = books[Math.floor(Math.random() * books.length)];
      const member = members[Math.floor(Math.random() * members.length)];
      const issueDate = new Date(today);
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 5));
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);

      await dbRun(
        `INSERT INTO transactions (book_id, member_id, issue_date, due_date, fine_amount, status, paid)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [book.id, member.id, issueDate.toISOString().split('T')[0], dueDate.toISOString().split('T')[0],
         0, 'issued', 0]
      );

      // Update available copies
      await dbRun('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book.id]);
      transactionCount++;
    }

    console.log(`Generated ${transactionCount} transactions`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    db.close();
  }
}

seedDatabase().catch(console.error);
