import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiCheckCircle, FiRefreshCcw } from 'react-icons/fi';

const DAILY_FINE = 5;

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

export default function IssueReturn() {
  const [activeTab, setActiveTab] = useState('issue');
  const [availableBooks, setAvailableBooks] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [issuedTransactions, setIssuedTransactions] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [issueLoading, setIssueLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  const loadDropdownData = async () => {
    setDropdownLoading(true);
    try {
      const [booksRes, membersRes] = await Promise.all([
        api.get('/books', { params: { available: true, limit: 200 } }),
        api.get('/members', { params: { status: 'active', limit: 200 } }),
      ]);
      const bookPayload = booksRes.data?.data?.books || booksRes.data?.books || [];
      const memberPayload = membersRes.data?.data?.members || membersRes.data?.members || [];
      setAvailableBooks(bookPayload);
      setActiveMembers(memberPayload);
    } catch (error) {
      console.error('[IssueReturn] Failed to load dropdown data', error);
      toast.error('Failed to load members or books');
    } finally {
      setDropdownLoading(false);
    }
  };

  const loadIssuedTransactions = async () => {
    setReturnLoading(true);
    try {
      const response = await api.get('/transactions', { params: { status: 'issued', limit: 200 } });
      const transactions = response.data?.data?.transactions || response.data?.transactions || [];
      setIssuedTransactions(transactions);
    } catch (error) {
      console.error('[IssueReturn] Failed to load issued transactions', error);
      toast.error('Failed to load issued books');
    } finally {
      setReturnLoading(false);
    }
  };

  useEffect(() => {
    loadDropdownData();
    loadIssuedTransactions();
  }, []);

  const handleIssue = async () => {
    if (!selectedBookId || !selectedMemberId) {
      toast.error('Please select both a member and a book');
      return;
    }
    setIssueLoading(true);
    try {
      await api.post('/transactions', {
        book_id: selectedBookId,
        member_id: selectedMemberId,
        due_date: dueDate,
      });
      toast.success('Book issued successfully');
      setSelectedBookId('');
      setSelectedMemberId('');
      setDueDate(defaultDueDate());
      loadDropdownData();
      loadIssuedTransactions();
    } catch (error) {
      console.error('[IssueReturn] Issue error', error);
      toast.error(error.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssueLoading(false);
    }
  };

  const calculateFine = (due) => {
    if (!due) return 0;
    const dueDateObject = new Date(due);
    const now = new Date();
    const diff = Math.floor((now - dueDateObject) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff * DAILY_FINE : 0;
  };

  const handleReturn = async (transaction) => {
    const fine = calculateFine(transaction.due_date);
    try {
      await api.put(`/transactions/${transaction.id}/return`, {
        return_date: new Date().toISOString().split('T')[0],
        fine_amount: fine,
      });
      toast.success('Book returned');
      loadDropdownData();
      loadIssuedTransactions();
    } catch (error) {
      console.error('[IssueReturn] Return error', error);
      toast.error(error.response?.data?.message || 'Failed to return book');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Issue & Return</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage circulation in one place.</p>
          </div>
          <button
            onClick={() => {
              loadDropdownData();
              loadIssuedTransactions();
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'issue'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('issue')}
            >
              Issue Book
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'return'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('return')}
            >
              Return Book
            </button>
          </div>

          {activeTab === 'issue' ? (
            <div className="p-4 space-y-4">
              {dropdownLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading options...</p>}
              <div>
                <label htmlFor="member-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Member
                </label>
                <select
                  id="member-select"
                  className="input-field"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  <option value="">Choose member</option>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.member_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="book-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Book
                </label>
                <select
                  id="book-select"
                  className="input-field"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                >
                  <option value="">Choose book</option>
                  {availableBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} — {book.available_copies ?? book.available_quantity} available
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="due-date"
                    type="date"
                    className="input-field pl-10"
                    value={dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleIssue}
                className="btn-primary w-full"
                disabled={issueLoading || !selectedBookId || !selectedMemberId}
              >
                {issueLoading ? 'Issuing...' : 'Issue Book'}
              </button>
            </div>
          ) : (
            <div className="p-4">
              {returnLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading issued books...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2">Member</th>
                        <th className="px-3 py-2">Book</th>
                        <th className="px-3 py-2">Issue Date</th>
                        <th className="px-3 py-2">Due Date</th>
                        <th className="px-3 py-2">Fine</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {issuedTransactions.map((tx) => {
                        const fine = calculateFine(tx.due_date);
                        return (
                          <tr key={tx.id}>
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{tx.member_name || tx.member_id}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{tx.member_member_id}</div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-gray-900 dark:text-gray-100">{tx.book_title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{tx.book_isbn}</div>
                            </td>
                            <td className="px-3 py-2">{tx.issue_date}</td>
                            <td className="px-3 py-2">{tx.due_date}</td>
                            <td className="px-3 py-2">
                              {fine > 0 ? (
                                <span className="text-red-600 dark:text-red-400 font-medium">₹{fine}</span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => handleReturn(tx)}
                                className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                                <span>Return</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {issuedTransactions.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                            No books currently issued.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}