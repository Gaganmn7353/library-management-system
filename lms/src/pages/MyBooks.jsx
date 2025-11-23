import React, { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext.jsx'

export default function MyBooks({user: userProp}){
  const { user: userFromContext } = useAuth();
  const user = userProp || userFromContext;
  const [my, setMy] = useState([])
  useEffect(()=>{
    if(!user) return
    (async()=>{
      const q = query(collection(db,'transactions'), where('userId','==', user.uid))
      const r = await getDocs(q)
      setMy(r.docs.map(d=>({ id:d.id, ...d.data() })))
    })()
  }, [user])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">My Borrowed Books</h2>
      <div className="space-y-3">
        {my.map(m=> (
          <div key={m.id} className="p-3 bg-white rounded shadow">
            <div>Book: {m.bookId}</div>
            <div>Issued: {m.issueDate?.toDate ? m.issueDate.toDate().toLocaleDateString() : (m.issueDate? new Date(m.issueDate).toLocaleDateString() : '—')}</div>
            <div>Due: {m.dueDate?.toDate ? m.dueDate.toDate().toLocaleDateString() : (m.dueDate? new Date(m.dueDate).toLocaleDateString() : '—')}</div>
            <div>Returned: {m.returnDate ? (m.returnDate.toDate ? m.returnDate.toDate().toLocaleDateString() : new Date(m.returnDate).toLocaleDateString() ) : 'No'}</div>
            <div>Fine: {m.fine || 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


