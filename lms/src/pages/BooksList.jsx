import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function BooksList() {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'books'), (snap) => {
      const rows = [];
      snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
      setBooks(rows);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return books;
    return books.filter((b) =>
      [b.title, b.author, b.subject, b.isbn].some((v) => String(v || '').toLowerCase().includes(needle))
    );
  }, [q, books]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, author, subject, ISBN" className="w-full max-w-md border p-2 rounded" />
        <Link to="/books/new" className="ml-3 px-3 py-2 bg-gray-900 text-white rounded">Add Book</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-50 text-left text-sm">
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Author</th>
              <th className="p-2 border">Subject</th>
              <th className="p-2 border">ISBN</th>
              <th className="p-2 border">Available</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="text-sm">
                <td className="p-2 border">{b.title}</td>
                <td className="p-2 border">{b.author}</td>
                <td className="p-2 border">{b.subject}</td>
                <td className="p-2 border">{b.isbn}</td>
                <td className="p-2 border">{b.availableCopies}</td>
                <td className="p-2 border">
                  <Link className="underline" to={`/books/${b.id}/edit`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


