import { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiTrendingUp, FiBook, FiUsers, FiDollarSign, FiDownload } from 'react-icons/fi';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function Reports() {
  const [popularBooks, setPopularBooks] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [overdueSummary, setOverdueSummary] = useState(null);
  const [memberActivity, setMemberActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Use correct endpoints
      const [popular, trends, cats, overdue, activity] = await Promise.all([
        api.get('/dashboard/popular-books?limit=10'),
        api.get('/reports/circulation?group_by=month'),
        api.get('/dashboard/popular-categories'),
        api.get('/reports/overdue'),
        api.get('/dashboard/active-members?limit=10'),
      ]);

      // Backend returns { success, message, data: { ... } }
      setPopularBooks(popular.data?.data?.books || popular.data?.books || []);
      
      // Format circulation report for monthly trends
      const circulationData = trends.data?.data?.report || trends.data?.report || [];
      const formattedTrends = circulationData.map(item => ({
        month: item.period ? new Date(item.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : item.period,
        issue_count: item.issued_count || 0,
        return_count: item.returned_count || 0,
      }));
      setMonthlyTrends(formattedTrends);
      
      setCategories(cats.data?.data?.categories || cats.data?.categories || []);
      
      // Format overdue summary from overdue report
      const overdueData = overdue.data?.data || overdue.data || {};
      setOverdueSummary({
        overdue_count: overdueData.summary?.total_overdue || overdueData.report?.length || 0,
        total_outstanding_fines: overdueData.summary?.total_remaining || overdueData.summary?.total_fine_amount || 0,
      });
      
      // Format member activity
      const membersData = activity.data?.data?.members || activity.data?.members || [];
      setMemberActivity({
        active_members: membersData.length || 0,
        recent_transactions: membersData.reduce((sum, m) => sum + (m.total_transactions || 0), 0),
        members_by_type: [
          { member_type: 'student', count: membersData.filter(m => m.member_type === 'student').length },
          { member_type: 'faculty', count: membersData.filter(m => m.member_type === 'faculty').length },
          { member_type: 'public', count: membersData.filter(m => m.member_type === 'public').length },
        ],
      });
    } catch (error) {
      console.error('Reports error:', error);
      toast.error('Failed to load reports');
      setPopularBooks([]);
      setMonthlyTrends([]);
      setCategories([]);
      setOverdueSummary(null);
      setMemberActivity(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      let url = '';
      switch (type) {
        case 'books':
          url = `${baseURL}/export/books`;
          break;
        case 'members':
          url = `${baseURL}/export/members`;
          break;
        case 'transactions':
          url = `${baseURL}/export/transactions`;
          break;
        case 'all':
          url = `${baseURL}/export/all`;
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownloadExcel('books')}
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export Books</span>
            </button>
            <button
              onClick={() => handleDownloadExcel('members')}
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export Members</span>
            </button>
            <button
              onClick={() => handleDownloadExcel('transactions')}
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export Transactions</span>
            </button>
            <button
              onClick={() => handleDownloadExcel('all')}
              className="btn-primary flex items-center space-x-2 text-sm"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue Books</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overdueSummary?.overdue_count || 0}
                </p>
              </div>
              <FiBook className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Fines</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{overdueSummary?.total_outstanding_fines?.toFixed(2) || '0.00'}
                </p>
              </div>
              <FiDollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {memberActivity?.active_members || 0}
                </p>
              </div>
              <FiUsers className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {memberActivity?.recent_transactions || 0}
                </p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Monthly Trends */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Monthly Issue/Return Trends
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="issue_count" stroke="#6366f1" name="Issued" />
                <Line type="monotone" dataKey="return_count" stroke="#10b981" name="Returned" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Books */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Most Popular Books
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={popularBooks.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="issue_count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Category Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="transaction_count"
                  nameKey="subject"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Member Activity */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Members by Type
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={memberActivity?.members_by_type || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="member_type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
