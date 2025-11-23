import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({ books: 0, issued: 0, members: 0 });

  useEffect(() => {
    const unsubBooks = onSnapshot(collection(db, 'books'), (snap) => {
      let totalBooks = 0;
      let issued = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        totalBooks += data.totalCopies || 0;
        issued += (data.totalCopies || 0) - (data.availableCopies || 0);
      });
      setStats((s) => ({ ...s, books: totalBooks, issued }));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats((s) => ({ ...s, members: snap.size }));
    });
    return () => {
      unsubBooks();
      unsubUsers();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <StatCard label="Total Books" value={stats.books} />
      <StatCard label="Issued Books" value={stats.issued} />
      <StatCard label="Active Members" value={stats.members} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded border bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}


