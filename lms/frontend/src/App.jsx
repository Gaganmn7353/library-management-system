import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import AddBook from './pages/AddBook';
import Members from './pages/Members';
import AddMember from './pages/AddMember';
import Transactions from './pages/Transactions';
import IssueReturn from './pages/IssueReturn';
import Reports from './pages/Reports';
import Users from './pages/Users';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireLibrarian>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <Books />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/add"
              element={
                <ProtectedRoute requireLibrarian>
                  <AddBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/edit/:id"
              element={
                <ProtectedRoute requireLibrarian>
                  <AddBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute requireLibrarian>
                  <Members />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/add"
              element={
                <ProtectedRoute requireLibrarian>
                  <AddMember />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/edit/:id"
              element={
                <ProtectedRoute requireLibrarian>
                  <AddMember />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute requireLibrarian>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issue-return"
              element={
                <ProtectedRoute requireLibrarian>
                  <IssueReturn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requireLibrarian>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/books" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--toast-bg, #363636)',
                color: 'var(--toast-color, #fff)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;