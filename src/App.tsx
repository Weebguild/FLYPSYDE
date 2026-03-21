import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import DayZero from './pages/DayZero';
import Onboarding from './pages/Onboarding';
import CheckIn from './pages/CheckIn';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import BottomNav from './components/BottomNav';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Day100Results from './pages/Day100Results';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
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
    </Router>
  );
}

export default App;
