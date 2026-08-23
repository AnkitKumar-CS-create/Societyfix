import Notices from './pages/Notices';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import Complaints from './pages/Complaints';
import Dashboard from './pages/Dashboard';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';

// Protects routes from unauthenticated users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* All protected routes are wrapped inside the Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      
        <Route path="/" element={<Dashboard />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/complaints/new" element={<NewComplaint />} />
        <Route path="/complaints/:id" element={<ComplaintDetail />} />
        <Route path="/notices" element={<Notices />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}