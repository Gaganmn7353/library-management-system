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
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load transactions');
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
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
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Book</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Issue Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Return Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Fine</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{transaction.book_title}</p>
                        <p className="text-sm text-gray-500">{transaction.book_author}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{transaction.member_name}</p>
                        <p className="text-sm text-gray-500">{transaction.member_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(transaction.issue_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          new Date(transaction.due_date) < new Date() &&
                          transaction.status !== 'returned'
                            ? 'text-red-600 font-semibold'
                            : ''
                        }
                      >
                        {new Date(transaction.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {transaction.return_date
                        ? new Date(transaction.return_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
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
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {transaction.status !== 'returned' && (
                          <button
                            onClick={() => handleReturn(transaction.id)}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Return
                          </button>
                        )}
                        {transaction.fine_amount > 0 && !transaction.paid && (
                          <button
                            onClick={() => handlePayFine(transaction.id)}
                            className="btn-secondary text-sm py-1 px-3 flex items-center space-x-1"
                          >
                            <FiDollarSign className="w-4 h-4" />
                            <span>Pay Fine</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-4">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600 dark:text-gray-400">
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