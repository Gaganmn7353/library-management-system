import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiSearch, FiBook, FiUser, FiCalendar } from 'react-icons/fi';
import { useDebounce } from '../hooks/useDebounce';

export default function IssueReturn() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const debouncedBookSearch = useDebounce(bookSearch, 300);
  const debouncedMemberSearch = useDebounce(memberSearch, 300);

  useEffect(() => {
    if (debouncedBookSearch) {
      searchBooks();
    } else {
      setBooks([]);
    }
  }, [debouncedBookSearch]);

  useEffect(() => {
    if (debouncedMemberSearch) {
      searchMembers();
    } else {
      setMembers([]);
    }
  }, [debouncedMemberSearch]);

  useEffect(() => {
    // Set default due date to 14 days from now
    const date = new Date();
    date.setDate(date.getDate() + 14);
    setDueDate(date.toISOString().split('T')[0]);
  }, []);

  const searchBooks = async () => {
    try {
      const response = await api.get('/books/search', {
        params: { q: debouncedBookSearch },
      });
      setBooks(response.data.books.filter((b) => b.available_copies > 0));
    } catch (error) {
      console.error('Book search error:', error);
    }
  };

  const searchMembers = async () => {
    try {
      const response = await api.get('/members', {
        params: { q: debouncedMemberSearch, status: 'active' },
      });
      setMembers(response.data.members);
    } catch (error) {
      console.error('Member search error:', error);
    }
  };

  const handleIssue = async () => {
    if (!selectedBook || !selectedMember) {
      toast.error('Please select both a book and a member');
      return;
    }

    setLoading(true);
    try {
      await api.post('/transactions/issue', {
        book_id: selectedBook.id,
        member_id: selectedMember.id,
        due_date: dueDate,
      });
      toast.success('Book issued successfully');
      setSelectedBook(null);
      setSelectedMember(null);
      setBookSearch('');
      setMemberSearch('');
      setBooks([]);
      setMembers([]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Issue Book
        </h1>

        <div className="card">
          <div className="space-y-6">
            {/* Book Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Book
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="input-field pl-10"
                />
              </div>
              {books.length > 0 && (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => {
                        setSelectedBook(book);
                        setBooks([]);
                        setBookSearch(book.title);
                      }}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{book.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Available: {book.available_copies} copies
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {selectedBook && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-900 dark:text-green-200">
                    Selected: {selectedBook.title}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    by {selectedBook.author}
                  </p>
                </div>
              )}
            </div>

            {/* Member Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Member
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name, email, or member ID..."
                  className="input-field pl-10"
                />
              </div>
              {members.length > 0 && (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member);
                        setMembers([]);
                        setMemberSearch(member.name);
                      }}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.member_id} - {member.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-900 dark:text-green-200">
                    Selected: {selectedMember.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedMember.member_id} - {selectedMember.email}
                  </p>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Issue Button */}
            <button
              onClick={handleIssue}
              disabled={loading || !selectedBook || !selectedMember}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Issuing...' : 'Issue Book'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}