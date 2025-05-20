import React from 'react';
import { motion } from 'framer-motion';
import './Transitions.css';

/**
 * Loading transition component for data fetching operations
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Loading state
 * @param {React.ReactNode} props.children - Child components
 * @param {React.ReactNode} props.fallback - Fallback component to show while loading
 * @param {string} props.type - Type of transition (fade, scale, etc.)
 * @returns {JSX.Element} Loading transition component
 */
const LoadingTransition = ({ 
  loading, 
  children, 
  fallback = null,
  type = 'fade',
  className = '',
  ...props 
}) => {
  // Select variants based on type
  const variants = loadingVariants[type] || loadingVariants.fade;
  
  return (
    <motion.div
      initial="initial"
      animate={loading ? "loading" : "loaded"}
      variants={variants}
      className={`loading-transition ${className}`}
      {...props}
    >
      {loading ? fallback : children}
    </motion.div>
  );
};

// Loading transition variants
const loadingVariants = {
  fade: {
    initial: { opacity: 0 },
    loading: { opacity: 0.7 },
    loaded: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    loading: { opacity: 0.7, scale: 0.98 },
    loaded: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  },
  pulse: {
    initial: { opacity: 0.7 },
    loading: { 
      opacity: [0.7, 0.9, 0.7],
      transition: { 
        repeat: Infinity,
        duration: 1.5
      }
    },
    loaded: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }
};

export default LoadingTransition;
