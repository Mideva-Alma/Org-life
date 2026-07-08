// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log('🔍 ProtectedRoute - Token:', token ? 'exists' : 'none');
    console.log('🔍 ProtectedRoute - Role:', role);
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // ✅ DON'T clear localStorage here!
    setIsAuthenticated(true);
    setIsAdmin(role === 'admin');
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}