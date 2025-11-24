import { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiSearch, FiRefreshCw, FiDollarSign } from 'react-icons/fi';
import { useDebounce } from '../hooks/useDebounce';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [status, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { status, page, limit: 10 };
      const response = await api.get('/transactions', { params });
      // Backend returns { success, message, data: { transactions, pagination } }
      const data = response.data?.data || response.data;
      setTransactions(data?.transactions || []);
      setPagination(data?.pagination || null);
    } catch (error) {
      toast.error('Failed to load transactions');
      setTransactions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id) => {
    try {
      await api.put(`/transactions/${id}/return`);
      toast.success('Book returned successfully');
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to return book');
    }
  };

  const handlePayFine = async (id) => {
    try {
      await api.put(`/transactions/${id}/pay`);
      toast.success('Fine paid successfully');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to pay fine');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <button onClick={fetchTransactions} className="btn-secondary flex items-center space-x-2">
            <FiRefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="card">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Book</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden md:table-cell">Member</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden lg:table-cell">Issue Date</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Due Date</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden lg:table-cell">Return Date</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Status</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden sm:table-cell">Fine</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-2 sm:px-4">
                      <div>
                        <p className="font-medium text-sm sm:text-base">{transaction.book_title}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{transaction.book_author}</p>
                        <p className="text-xs text-gray-500 md:hidden mt-1">{transaction.member_name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                      <div>
                        <p className="font-medium text-sm">{transaction.member_name}</p>
                        <p className="text-xs text-gray-500">{transaction.member_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">
                      {new Date(transaction.issue_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span
                        className={`text-xs sm:text-sm ${
                          new Date(transaction.due_date) < new Date() &&
                          transaction.status !== 'returned'
                            ? 'text-red-600 font-semibold'
                            : ''
                        }`}
                      >
                        {new Date(transaction.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">
                      {transaction.return_date
                        ? new Date(transaction.return_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span
                        className={`badge text-xs ${
                          transaction.status === 'returned'
                            ? 'badge-success'
                            : transaction.status === 'overdue'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                      {transaction.fine_amount > 0 ? (
                        <span
                          className={`font-semibold ${
                            transaction.paid ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          ${transaction.fine_amount.toFixed(2)}
                          {transaction.paid && ' (Paid)'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                        {transaction.status !== 'returned' && (
                          <button
                            onClick={() => handleReturn(transaction.id)}
                            className="btn-secondary text-xs sm:text-sm py-1 px-2 sm:px-3"
                          >
                            Return
                          </button>
                        )}
                        {transaction.fine_amount > 0 && !transaction.paid && (
                          <button
                            onClick={() => handlePayFine(transaction.id)}
                            className="btn-secondary text-xs sm:text-sm py-1 px-2 sm:px-3 flex items-center space-x-1"
                          >
                            <FiDollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Pay Fine</span>
                            <span className="sm:hidden">Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-4 px-2 sm:px-4">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}