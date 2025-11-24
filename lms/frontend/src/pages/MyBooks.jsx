import { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiBook, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function MyBooks() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMyBooks();
    }
  }, [user]);

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      // Get member ID from user
      const memberResponse = await api.get('/members');
      // Backend returns { success, message, data: { members } }
      const memberData = memberResponse.data?.data || memberResponse.data;
      const members = memberData?.members || [];
      const myMember = members.find(m => m.email === user.email);
      
      if (myMember) {
        const response = await api.get(`/transactions/member/${myMember.id}`);
        // Backend returns { success, message, data: { transactions } }
        const transactionData = response.data?.data || response.data;
        setTransactions(transactionData?.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('MyBooks error:', error);
      toast.error('Failed to load your books');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeBooks = transactions.filter(t => t.status === 'issued' || t.status === 'overdue');
  const returnedBooks = transactions.filter(t => t.status === 'returned');

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
          My Books
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Books</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeBooks.length}
                </p>
              </div>
              <FiBook className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Returned Books</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {returnedBooks.length}
                </p>
              </div>
              <FiCalendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Fines</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{transactions
                    .filter(t => t.fine_amount > 0 && !t.paid)
                    .reduce((sum, t) => sum + (t.fine_amount || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <FiDollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Active Books */}
        {activeBooks.length > 0 && (
          <div className="card mb-6 sm:mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiBook className="w-6 h-6 text-blue-500 mr-2" />
              Currently Issued Books
            </h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Book</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden sm:table-cell">Issue Date</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Due Date</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Status</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden md:table-cell">Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBooks.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-2 sm:px-4">
                          <div>
                            <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                              {transaction.book_title || 'Unknown Book'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {transaction.book_author || 'Unknown Author'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                          {transaction.issue_date
                            ? new Date(transaction.issue_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <span
                            className={`text-xs sm:text-sm ${
                              new Date(transaction.due_date) < new Date() &&
                              transaction.status !== 'returned'
                                ? 'text-red-600 font-semibold'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {transaction.due_date
                              ? new Date(transaction.due_date).toLocaleDateString()
                              : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <span
                            className={`badge text-xs ${
                              transaction.status === 'overdue'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">
                          {transaction.fine_amount > 0 ? (
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              ₹{transaction.fine_amount.toFixed(2)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Returned Books */}
        {returnedBooks.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiCalendar className="w-6 h-6 text-green-500 mr-2" />
              Returned Books History
            </h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Book</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden sm:table-cell">Issue Date</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden md:table-cell">Return Date</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Fine Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnedBooks.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-2 sm:px-4">
                          <div>
                            <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                              {transaction.book_title || 'Unknown Book'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {transaction.book_author || 'Unknown Author'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                          {transaction.issue_date
                            ? new Date(transaction.issue_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">
                          {transaction.return_date
                            ? new Date(transaction.return_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          {transaction.fine_amount > 0 ? (
                            <span
                              className={`text-xs sm:text-sm font-semibold ${
                                transaction.paid
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              ₹{transaction.fine_amount.toFixed(2)}
                              {transaction.paid ? ' (Paid)' : ' (Pending)'}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-500">No fine</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {transactions.length === 0 && !loading && (
          <div className="card text-center py-12">
            <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No books found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You haven't issued any books yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
