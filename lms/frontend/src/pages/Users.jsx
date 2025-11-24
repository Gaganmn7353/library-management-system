import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCcw } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/users', { params });
      const data = response.data?.data?.users || [];
      setUsers(data);
    } catch (error) {
      console.error('[Users] Failed to load users', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus });
      toast.success(`User ${nextStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      console.error('[Users] Failed to toggle status', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      console.error('[Users] Failed to delete user', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setIsEditOpen(true);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage administrators, librarians, and members.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="btn-secondary flex items-center space-x-2"
              aria-label="Refresh users list"
            >
              <FiRefreshCcw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="btn-primary flex items-center space-x-2"
              aria-label="Add user"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                id="search"
                name="search"
                type="text"
                className="input-field"
                placeholder="Search by username or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                id="roleFilter"
                className="input-field"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="admin">Admin</option>
                <option value="librarian">Librarian</option>
                <option value="member">Member</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="statusFilter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full" aria-label="Apply filters">
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        <div className="card overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.created_at?.slice(0, 10)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{user.email}</td>
                    <td className="px-4 py-3 capitalize text-sm text-gray-700 dark:text-gray-200">{user.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge text-xs ${
                          user.status === 'active' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{user.member_id || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="btn-secondary text-xs"
                          aria-label={`Toggle status for ${user.username}`}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label={`Edit ${user.username}`}
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          aria-label={`Delete ${user.username}`}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                      colSpan={6}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddUserModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchUsers} />
      <EditUserModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={fetchUsers}
        user={editingUser}
      />
    </div>
  );
}

