import React from 'react';
import { motion, Transition } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};

const pageTransition: Transition = {
  type: 'tween' as const,
  ease: 'anticipate',
  duration: 0.3
};

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '', style }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
