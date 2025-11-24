import { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberType, setMemberType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearch, memberType, status, page]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = {
        q: debouncedSearch,
        type: memberType,
        status: status,
        page: page,
        limit: 10,
      };
      console.log('[Members] Fetching members', params);
      const response = await api.get('/members', { params });
      // Backend returns { success, message, data: { members, pagination } }
      const data = response.data?.data || response.data;
      setMembers(data?.members || []);
      setPagination(data?.pagination || null);
    } catch (error) {
      console.error('[Members] Failed to load members', error);
      toast.error('Failed to load members');
      setMembers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;

    try {
      console.log('[Members] Deleting member', { id });
      await api.delete(`/members/${id}`);
      toast.success('Member deleted successfully');
      fetchMembers();
    } catch (error) {
      console.error('[Members] Failed to delete member', error);
      toast.error(error.response?.data?.error || 'Failed to delete member');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Members</h1>
          <Link
            to="/members/add"
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Member</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="input-field pl-10"
              />
            </div>

            <select
              value={memberType}
              onChange={(e) => setMemberType(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="public">Public</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
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
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Member ID</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Name</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold hidden md:table-cell">Email</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Type</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Status</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{member.member_id}</td>
                    <td className="py-3 px-2 sm:px-4 font-medium text-sm sm:text-base">
                      <div>
                        <div>{member.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden">{member.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">{member.email}</td>
                    <td className="py-3 px-2 sm:px-4">
                      <span className="badge badge-info capitalize text-xs">{member.member_type}</span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span
                        className={`badge text-xs ${
                          member.status === 'active' ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Link
                          to={`/members/edit/${member.id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
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
