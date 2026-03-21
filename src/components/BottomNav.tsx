import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionLink = motion(Link);

const BottomNav: React.FC = () => {
  const location = useLocation();

  // Hide nav on onboarding or day-zero
  if (location.pathname === '/' || location.pathname === '/onboarding' || location.pathname === '/day-zero') {
    return null;
  }

  const navItems = [
    { path: '/home', icon: <Home size={24} />, label: 'Feed' },
    { path: '/checkin', icon: <Camera size={24} />, label: 'Check-In' },
    { path: '/leaderboard', icon: <Trophy size={24} />, label: 'Rankings' },
    { path: '/profile', icon: <User size={24} />, label: 'Profile' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '400px',
      background: 'rgba(255, 255, 255, 0.05)', // Refraction mapped to dark theme
      backdropFilter: 'blur(10px)', // Blur: 10
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '50px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', // Depth: 8
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '0.8rem 1rem',
      zIndex: 1000
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <MotionLink 
            key={item.path} 
            to={item.path} 
            whileTap={{ scale: 0.85 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textDecoration: 'none',
              color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
              transition: 'all 0.3s ease'
            }}
          >
            <motion.div
              animate={{ y: isActive ? -4 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {item.icon}
            </motion.div>
            <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: isActive ? 'bold' : 'normal' }}>
              {item.label}
            </span>
          </MotionLink>
        )
      })}
    </nav>
  );
};

export default BottomNav;
