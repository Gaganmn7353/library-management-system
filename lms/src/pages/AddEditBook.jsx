import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function AddEditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ title: '', author: '', subject: '', isbn: '', totalCopies: 1, availableCopies: 1 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const snap = await getDoc(doc(collection(db, 'books'), id));
      if (snap.exists()) setForm(snap.data());
    })();
  }, [id, isEdit]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) {
        await updateDoc(doc(collection(db, 'books'), id), form);
      } else {
        const ref = doc(collection(db, 'books'));
        await setDoc(ref, form);
      }
      navigate('/books');
    } catch (err) {
      setError(err.message);
    }
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-xl mx-auto p-6 bg-white mt-6 rounded border">
      <h2 className="text-xl font-semibold mb-4">{isEdit ? 'Edit Book' : 'Add Book'}</h2>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Title" value={form.title} onChange={(e) => update('title', e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Author" value={form.author} onChange={(e) => update('author', e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="ISBN" value={form.isbn} onChange={(e) => update('isbn', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full border p-2 rounded" type="number" min={1} placeholder="Total Copies" value={form.totalCopies} onChange={(e) => update('totalCopies', Number(e.target.value))} />
          <input className="w-full border p-2 rounded" type="number" min={0} placeholder="Available Copies" value={form.availableCopies} onChange={(e) => update('availableCopies', Number(e.target.value))} />
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded" type="submit">Save</button>
      </form>
    </div>
  );
}


