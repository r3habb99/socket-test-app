import React, { createContext, useContext, useState } from 'react';

// Create a context for transition state
const TransitionContext = createContext({
  transitionType: 'fade',
  setTransitionType: () => {},
});

/**
 * Hook to access transition state
 * @returns {Object} Transition context
 */
export const useGlobalTransition = () => useContext(TransitionContext);

/**
 * Provider component for global transition state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export const TransitionProvider = ({ children }) => {
  const [transitionType, setTransitionType] = useState('fade');

  const value = {
    transitionType,
    setTransitionType,
  };

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
};

export default TransitionProvider;
