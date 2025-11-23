import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Books from './pages/Books.jsx';
import AddBook from './pages/AddBook.jsx';
import IssueReturn from './pages/IssueReturn.jsx';
import MyBooks from './pages/MyBooks.jsx';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 text-gray-800">
        <Navbar />
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            } />

            <Route path="/books" element={
              <AdminRoute>
                <Books />
              </AdminRoute>
            } />

            <Route path="/books/new" element={
              <AdminRoute>
                <AddBook />
              </AdminRoute>
            } />

            <Route path="/books/:id/edit" element={
              <AdminRoute>
                <AddBook />
              </AdminRoute>
            } />

            <Route path="/transactions" element={
              <AdminRoute>
                <IssueReturn />
              </AdminRoute>
            } />

            <Route path="/my-books" element={
              <ProtectedRoute>
                <MyBooks />
              </ProtectedRoute>
            } />

            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;


