import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, profile, logout } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">LMS</Link>
        {user ? (
          <div className="flex items-center gap-4">
            {profile?.role === 'librarian' && (
              <>
                <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                <Link to="/books" className="hover:underline">Books</Link>
                <Link to="/transactions" className="hover:underline">Issue/Return</Link>
              </>
            )}
            <Link to="/my-books" className="hover:underline">My Books</Link>
            <span className="text-sm text-gray-600">{profile?.name} ({profile?.role})</span>
            <button onClick={logout} className="px-3 py-1 rounded bg-gray-900 text-white">Logout</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-3 py-1 rounded bg-gray-900 text-white">Login</Link>
            <Link to="/register" className="px-3 py-1 rounded border border-gray-300">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}


