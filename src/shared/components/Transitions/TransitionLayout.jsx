import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PageTransition from './PageTransition';

/**
 * TransitionLayout component that wraps content with smooth transitions
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.transitionType - Type of transition (fade, slide, slideUp, none)
 * @returns {JSX.Element} Animated layout component
 */
const TransitionLayout = ({
  children,
  transitionType = 'fade',
  ...props
}) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition
        transitionKey={location.key || location.pathname}
        key={location.key || location.pathname}
        transitionType={transitionType}
        {...props}
      >
        {children}
      </PageTransition>
    </AnimatePresence>
  );
};

export default TransitionLayout;
