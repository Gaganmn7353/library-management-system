import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FiBook, FiUsers, FiAlertCircle, FiDollarSign, FiTrendingUp, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueBooks, setOverdueBooks] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchOverdueBooks();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      // Backend returns nested structure, extract stats object
      const statsData = response.data?.data?.stats || response.data?.stats || response.data;
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
      setStats(null); // Set to null on error
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueBooks = async () => {
    try {
      const response = await api.get('/transactions/overdue');
      // Handle different response structures
      const transactions = response.data?.data?.transactions || 
                          response.data?.transactions || 
                          response.data || [];
      setOverdueBooks(Array.isArray(transactions) ? transactions.slice(0, 5) : []);
    } catch (error) {
      console.error('Overdue books error:', error);
      setOverdueBooks([]); // Set empty array on error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If stats failed to load, show error message but still render the page
  if (!stats) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
            Dashboard
          </h1>
          <div className="card">
            <div className="text-center py-12">
              <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                Failed to load dashboard data
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Please check your connection and try refreshing the page.
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchDashboardData();
                  fetchOverdueBooks();
                }}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Books',
      value: stats?.books?.total || 0,
      icon: FiBook,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Available Books',
      value: stats?.books?.available || 0,
      icon: FiBook,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      title: 'Issued Books',
      value: stats?.transactions?.issued || 0,
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      change: '+8%',
    },
    {
      title: 'Total Members',
      value: stats?.members?.total || 0,
      icon: FiUsers,
      color: 'bg-indigo-500',
      change: '+3%',
    },
    {
      title: 'Active Members',
      value: stats?.members?.active || 0,
      icon: FiUsers,
      color: 'bg-pink-500',
      change: '+2%',
    },
    {
      title: 'Overdue Books',
      value: stats?.transactions?.overdue || 0,
      icon: FiAlertCircle,
      color: 'bg-red-500',
      change: '-1%',
    },
    {
      title: 'Total Fines',
      value: `₹${(stats?.fines?.total_collected || 0).toFixed(2)}`,
      icon: FiDollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
          Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="card hover:shadow-xl transition-shadow duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overdue Books */}
        {overdueBooks.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiAlertCircle className="w-6 h-6 text-red-500 mr-2" />
              Overdue Books
            </h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Book
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                        Member
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Due Date
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Fine
                      </th>
                    </tr>
                  </thead>
                <tbody>
                  {overdueBooks.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-2 sm:px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                            {book.book_title}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {book.book_author}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden mt-1">
                            {book.member_name}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                        <p className="text-gray-900 dark:text-white text-sm">{book.member_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {book.member_email}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className="badge badge-danger text-xs">
                          {new Date(book.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className="font-semibold text-red-600 dark:text-red-400 text-sm sm:text-base">
                          ₹{(book.calculated_fine || book.fine_amount || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card hover:shadow-xl transition-shadow cursor-pointer">
            <FiBook className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Books
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Add, edit, or remove books from the library catalog.
            </p>
          </div>

          <div className="card hover:shadow-xl transition-shadow cursor-pointer">
            <FiUsers className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Members
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Register new members or update existing member information.
            </p>
          </div>

          <div className="card hover:shadow-xl transition-shadow cursor-pointer">
            <FiClock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Issue/Return Books
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Process book issues and returns, manage transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}