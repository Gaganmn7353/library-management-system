import { useEffect, useState } from 'react'
import axios from 'axios'

export default function MyBooks() {
  const [trxs, setTrxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/transactions/my')
        setTrxs(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">Transaction</th>
            <th>User</th>
            <th>Book</th>
            <th>Issued</th>
            <th>Due</th>
            <th>Returned</th>
            <th>Fine</th>
          </tr>
        </thead>
        <tbody>
          {!loading && trxs.map(t => (
            <tr key={t.id} className="border-b text-sm">
              <td className="py-2">#{t.id}</td>
              <td>{t.user_id}</td>
              <td>{t.book_id}</td>
              <td>{new Date(t.issued_at).toLocaleDateString()}</td>
              <td>{new Date(t.due_at).toLocaleDateString()}</td>
              <td>{t.returned_at ? new Date(t.returned_at).toLocaleDateString() : '-'}</td>
              <td>{t.fine_collected}</td>
            </tr>
          ))}
          {loading && (
            <tr><td className="py-3" colSpan="7">Loading...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}


