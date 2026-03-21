import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Keep essential onboarding flows eagerly loaded
import DayZero from './pages/DayZero';
import Onboarding from './pages/Onboarding';

// Lazy load app tabs to slice the Vite bundle size down for faster cold starts
const Home = lazy(() => import('./pages/Home'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Day100Results = lazy(() => import('./pages/Day100Results'));

// Fallback loader while downloading the bundle for a tab
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid var(--surface-container-highest)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/day-zero" />} />
          <Route path="/day-zero" element={<DayZero />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/day-100" element={<Day100Results />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { 
            background: 'rgba(38, 38, 38, 0.9)', 
            color: '#fff', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(73, 72, 71, 0.3)' 
          } 
        }} 
      />
      <BottomNav />
      <AnimatedRoutes />
      <SpeedInsights />
    </Router>
  );
}

export default App;
