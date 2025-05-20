import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Transitions.css';

/**
 * Form transition component for smooth form submissions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components (form elements)
 * @param {Function} props.onSubmit - Form submission handler
 * @param {boolean} props.submitting - Form submission state
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Form transition component
 */
const FormTransition = ({ 
  children, 
  onSubmit,
  submitting = false,
  className = '',
  ...props 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(submitting);
  
  // Handle form submission with animation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the onSubmit handler and wait for it to complete
      await onSubmit(e);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.form
      onSubmit={handleSubmit}
      className={`form-transition ${className} ${isSubmitting ? 'submitting' : ''}`}
      initial="initial"
      animate={isSubmitting ? "submitting" : "idle"}
      variants={formVariants}
      {...props}
    >
      {children}
    </motion.form>
  );
};

// Form animation variants
const formVariants = {
  initial: {
    opacity: 1,
  },
  idle: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  submitting: {
    opacity: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

export default FormTransition;
