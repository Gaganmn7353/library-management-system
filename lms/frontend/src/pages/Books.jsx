import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiFilter, FiX, FiBook } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState('all');
  const [subject, setSubject] = useState('');
  const [sort, setSort] = useState('title');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const { isLibrarian } = useAuth();

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (filter !== 'all') params.set('filter', filter);
    if (subject) params.set('subject', subject);
    params.set('sort', sort);
    params.set('order', order);
    params.set('page', page);
    params.set('limit', 12);

    setSearchParams(params);
    fetchBooks(params);
  }, [debouncedSearch, filter, subject, sort, order, page]);

  const fetchBooks = async (params) => {
    setLoading(true);
    try {
      console.log('[Books] Fetching catalog', Object.fromEntries(params.entries?.() || []));
      const response = await api.get('/books', { params });
      // Backend returns { success, message, data: { books, pagination } }
      const data = response.data?.data || response.data;
      setBooks(data?.books || []);
      setPagination(data?.pagination || null);
    } catch (error) {
      console.error('[Books] Failed to load books', error);
      toast.error('Failed to load books');
      console.error('Books error:', error);
      setBooks([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      console.log('[Books] Deleting book', { id });
      await api.delete(`/books/${id}`);
      toast.success('Book deleted successfully');
      fetchBooks(new URLSearchParams(searchParams));
    } catch (error) {
      console.error('[Books] Failed to delete book', error);
      toast.error(error.response?.data?.error || 'Failed to delete book');
    }
  };

  const subjects = [
    'Fiction',
    'Non-Fiction',
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Business',
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Books Catalog</h1>
          {isLibrarian && (
            <Link
              to="/books/add"
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Book</span>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Fields</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="subject">Subject</option>
              </select>
            </div>

            <div>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              >
                <option value="">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input-field"
              >
                <option value="title">Sort by Title</option>
                <option value="author">Sort by Author</option>
                <option value="year">Sort by Year</option>
                <option value="popularity">Sort by Popularity</option>
              </select>

              <button
                onClick={() => setOrder(order === 'ASC' ? 'DESC' : 'ASC')}
                className="btn-secondary"
              >
                {order === 'ASC' ? '↑ Ascending' : '↓ Descending'}
              </button>

              {(searchQuery || subject) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSubject('');
                    setFilter('all');
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FiX className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            {pagination && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Showing {books.length} of {pagination.total} books
              </p>
            )}
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="card text-center py-12">
            <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No books found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="card hover:shadow-xl transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="mb-4">
                    <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <FiBook className="w-16 h-16 text-white opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {book.author}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge badge-info">{book.subject}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {book.publication_year}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Available: {book.available_copies}/{book.total_copies}
                      </span>
                      {book.available_copies === 0 && (
                        <span className="badge badge-danger text-xs">Unavailable</span>
                      )}
                    </div>
                  </div>

                  {isLibrarian && (
                    <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        to={`/books/edit/${book.id}`}
                        className="flex-1 btn-secondary text-center py-2 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiEdit className="w-4 h-4 inline mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(book.id);
                        }}
                        className="flex-1 btn-secondary text-red-600 dark:text-red-400 text-center py-2 text-sm"
                      >
                        <FiTrash2 className="w-4 h-4 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600 dark:text-gray-400">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Book Detail Modal */}
        {selectedBook && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBook(null)}
          >
            <div
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedBook.title}
                </h2>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Author</p>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedBook.author}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ISBN</p>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedBook.isbn}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subject</p>
                  <span className="badge badge-info">{selectedBook.subject}</span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Publisher</p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {selectedBook.publisher || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Publication Year
                  </p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {selectedBook.publication_year || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Shelf Location
                  </p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {selectedBook.shelf_location || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Availability
                  </p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {selectedBook.available_copies} of {selectedBook.total_copies} copies
                    available
                  </p>
                </div>

                {selectedBook.available_copies === 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-red-800 dark:text-red-200">
                      This book is currently unavailable
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}