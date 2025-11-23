import { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/firebase';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';

const DAILY_FINE = 5; // ₹5 per day
const LOAN_DAYS = 14;

export default function Transactions() {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userId, setUserId] = useState('');
  const [bookId, setBookId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setUsers(arr);
    });
    const unsubBooks = onSnapshot(collection(db, 'books'), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBooks(arr);
    });
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setTransactions(arr);
    });
    return () => {
      unsubUsers();
      unsubBooks();
      unsubTx();
    };
  }, []);

  const issue = async () => {
    setError('');
    try {
      const bookRef = doc(collection(db, 'books'), bookId);
      const bookSnap = await getDoc(bookRef);
      const book = bookSnap.data();
      if (!book || (book.availableCopies || 0) <= 0) throw new Error('No copies available');
      const now = new Date();
      const dueDate = addDays(now, LOAN_DAYS).toISOString();
      const txRef = doc(collection(db, 'transactions'));
      await setDoc(txRef, { userId, bookId, issueDate: now.toISOString(), dueDate, returnDate: null, fine: 0 });
      await updateDoc(bookRef, { availableCopies: (book.availableCopies || 0) - 1 });
      setBookId('');
    } catch (e) {
      setError(e.message);
    }
  };

  const returnBook = async (tx) => {
    setError('');
    try {
      if (tx.returnDate) return;
      const bookRef = doc(collection(db, 'books'), tx.bookId);
      const bookSnap = await getDoc(bookRef);
      const book = bookSnap.data();
      const now = new Date();
      const due = new Date(tx.dueDate || tx.issueDate);
      const lateDays = Math.max(0, differenceInCalendarDays(now, due));
      const fine = lateDays * DAILY_FINE;
      await updateDoc(doc(collection(db, 'transactions'), tx.id), { returnDate: now.toISOString(), fine });
      await updateDoc(bookRef, { availableCopies: (book.availableCopies || 0) + 1 });
    } catch (e) {
      setError(e.message);
    }
  };

  const currentBorrows = useMemo(() => transactions.filter((t) => !t.returnDate), [transactions]);

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Issue Book</h3>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="space-y-3">
          <select className="w-full border p-2 rounded" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select member</option>
            {users.map((u) => (
              <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>
            ))}
          </select>
          <select className="w-full border p-2 rounded" value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">Select book</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title} — {b.availableCopies} available</option>
            ))}
          </select>
          <button disabled={!userId || !bookId} onClick={issue} className="px-3 py-2 bg-gray-900 text-white rounded disabled:opacity-50">Issue</button>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Active Borrows</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50 text-left text-sm">
                <th className="p-2 border">User</th>
                <th className="p-2 border">Book</th>
                <th className="p-2 border">Issued</th>
                <th className="p-2 border">Due</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentBorrows.map((t) => (
                <tr key={t.id} className="text-sm">
                  <td className="p-2 border">{users.find((u) => u.uid === t.userId)?.name}</td>
                  <td className="p-2 border">{books.find((b) => b.id === t.bookId)?.title}</td>
                  <td className="p-2 border">{format(new Date(t.issueDate), 'dd MMM yyyy')}</td>
                  <td className="p-2 border">{format(new Date(t.dueDate || t.issueDate), 'dd MMM yyyy')}</td>
                  <td className="p-2 border">
                    <button onClick={() => returnBook(t)} className="px-2 py-1 bg-green-600 text-white rounded">Return</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


