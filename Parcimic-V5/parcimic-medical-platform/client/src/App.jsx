import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Lazy load pages for better performance
const Home        = lazy(() => import('./pages/Home'));
const HealthCheck = lazy(() => import('./pages/HealthCheck'));
const Result      = lazy(() => import('./pages/Result'));
const Assistant   = lazy(() => import('./pages/Assistant'));
const EmergencyMap = lazy(() => import('./pages/EmergencyMap'));
const History     = lazy(() => import('./pages/History'));
const Timeline    = lazy(() => import('./pages/Timeline'));
const Profile     = lazy(() => import('./pages/Profile'));
const Medications = lazy(() => import('./pages/Medications'));

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

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
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index          element={<Home />} />
              <Route path="check"   element={<HealthCheck />} />
              <Route path="result"  element={<Result />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="emergency" element={<EmergencyMap />} />
              <Route path="history"   element={<History />} />
              <Route path="timeline"  element={<Timeline />} />
              <Route path="medications" element={<Medications />} />
              <Route path="profile"   element={<Profile />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
