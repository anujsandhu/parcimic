import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home        from './pages/Home';
import HealthCheck from './pages/HealthCheck';
import Result      from './pages/Result';
import Assistant   from './pages/Assistant';
import EmergencyMap from './pages/EmergencyMap';
import History     from './pages/History';
import Profile     from './pages/Profile';
import Medications from './pages/Medications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index          element={<Home />} />
            <Route path="check"   element={<HealthCheck />} />
            <Route path="result"  element={<Result />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="emergency" element={<EmergencyMap />} />
            <Route path="history"   element={<History />} />
            <Route path="medications" element={<Medications />} />
            <Route path="profile"   element={<Profile />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
