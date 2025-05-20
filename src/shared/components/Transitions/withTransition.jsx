import React from 'react';
import { ComponentTransition } from './index';

/**
 * Higher-order component that adds transition effects to any component
 * @param {React.ComponentType} Component - Component to wrap with transition
 * @param {Object} options - Transition options
 * @param {string} options.type - Type of transition (fade, slide, scale, etc.)
 * @param {Object} options.customVariants - Custom animation variants
 * @returns {React.ComponentType} Component with transition effects
 */
const withTransition = (Component, options = {}) => {
  const { 
    type = 'fade',
    customVariants = null,
    className = '',
    ...transitionProps
  } = options;
  
  const WithTransition = (props) => {
    return (
      <ComponentTransition 
        type={type}
        customVariants={customVariants}
        className={className}
        {...transitionProps}
      >
        <Component {...props} />
      </ComponentTransition>
    );
  };
  
  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithTransition.displayName = `withTransition(${displayName})`;
  
  return WithTransition;
};

export default withTransition;
