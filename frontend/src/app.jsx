// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';  // Make sure file is Landing.jsx
import Auth from './pages/Auth';        // Make sure file is Auth.jsx
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Verify from './pages/Verify'; // <-- CHANGE: lowercase 'v' if file is verify.jsx
import ProtectedRoute from './components/ProtectedRoute';
import './app.css'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/verify" element={<Verify />} />
        
        {/* Protected user routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* NEW: Admin route - protected with admin check */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;