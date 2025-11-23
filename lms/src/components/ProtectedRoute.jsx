import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { Navigate } from 'react-router-dom'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="text-center mt-10">Loading...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

export function AdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="text-center mt-10">Loading...</div>
  if (!profile || profile.role !== 'librarian') return <Navigate to="/" />
  return children
}


