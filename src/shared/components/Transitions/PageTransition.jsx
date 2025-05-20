import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import './Transitions.css';

/**
 * Page transition component that wraps route components
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.transitionKey - Unique key for the transition
 * @param {Object} props.variants - Animation variants
 * @param {string} props.transitionType - Type of transition (fade, slide, none)
 * @returns {JSX.Element} Animated page component
 */
const PageTransition = ({
  children,
  transitionKey,
  transitionType = 'fade',
  variants,
  className = '',
  ...props
}) => {
  const ref = useRef(null);

  // Skip animation if transitionType is 'none'
  if (transitionType === 'none') {
    return <div className={`page-transition ${className}`}>{children}</div>;
  }

  // Select variants based on transition type
  const selectedVariants = variants || transitionVariants[transitionType] || transitionVariants.fade;

  return (
    <motion.div
      ref={ref}
      key={transitionKey}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={selectedVariants}
      className={`page-transition ${className}`}
      transition={{
        duration: 0.3,
        ease: [0.25, 1, 0.5, 1]
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Transition variants for different types of transitions
const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: 'easeOut',
      },
    },
  },
  slide: {
    initial: {
      opacity: 0,
      x: 20,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.15,
        ease: 'easeOut',
      },
    },
  },
  slideUp: {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.15,
        ease: 'easeOut',
      },
    },
  },
};

export default PageTransition;
