import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

import './css/style.css';

import './charts/ChartjsConfig';

// Import context
import { AuthProvider } from './utils/AuthContext';

// Import components
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Dashboard from './pages/Dashboard';
import LegalDocuments from './pages/LegalDocuments';
import PublishedDocuments from './pages/PublishedDocuments';
import Login from './pages/Login';
import Landing from './pages/Landing';

function App() {

  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]); // triggered on route change

  return (
    <AuthProvider>
      <Routes>
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/landing" element={<Landing />} />
        <Route exact path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route exact path="/legal-documents" element={
          // <ProtectedRoute>
            <LegalDocuments />
          // </ProtectedRoute>
        } />
        <Route exact path="/published-documents" element={
          <PublishedDocuments />
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
