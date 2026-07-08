import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Auth from "./pages/auth";
import Dashboard from "./pages/dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminTransactions from "./pages/AdminTransactions";
import "./app.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/transactions" element={
          <ProtectedRoute requireAdmin><AdminTransactions /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}