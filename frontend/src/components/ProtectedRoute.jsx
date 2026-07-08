// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const user = await api.getCurrentUser();
        setIsAuthenticated(true);
        setIsAdmin(user.role === 'admin' || role === 'admin');
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check admin-only access
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}