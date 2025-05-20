import React from 'react';
import { motion } from 'framer-motion';
import './Transitions.css';

/**
 * Button with built-in transition effects
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.effect - Animation effect (scale, lift, bounce)
 * @returns {JSX.Element} Button with transition effects
 */
const TransitionButton = ({ 
  children, 
  type = 'button',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  effect = 'scale',
  ...props 
}) => {
  // Select variants based on effect
  const variants = buttonVariants[effect] || buttonVariants.scale;
  
  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`transition-button ${className} ${loading ? 'loading' : ''}`}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate={loading ? "loading" : "initial"}
      variants={variants}
      {...props}
    >
      {children}
      {loading && (
        <span className="loading-indicator">
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </span>
      )}
    </motion.button>
  );
};

// Button animation variants
const buttonVariants = {
  scale: {
    initial: {
      scale: 1,
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
    loading: {
      opacity: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  },
  lift: {
    initial: {
      y: 0,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      y: -2,
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      transition: {
        duration: 0.2,
      },
    },
    tap: {
      y: 1,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      transition: {
        duration: 0.1,
      },
    },
    loading: {
      opacity: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  },
  bounce: {
    initial: {
      scale: 1,
    },
    hover: {
      scale: 1.05,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
    loading: {
      opacity: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  },
};

export default TransitionButton;
