import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import {
  initForm,
  updateForm,
  updateField,
  setFormErrors,
  setFieldError,
  clearFieldError,
  touchField,
  touchFields,
  touchAllFields,
  setFormSubmitting,
  resetForm,
  removeForm,
  selectForm,
  selectFormErrors,
  selectFormTouched,
  selectIsFormSubmitting,
  selectIsFormSubmitted,
  selectIsFormDirty,
  selectFieldValue,
  selectFieldError,
  selectIsFieldTouched,
  selectIsFormValid,
} from '../store/formSlice';

/**
 * Custom hook for form state management
 * @param {string} formId - Unique identifier for the form
 * @param {Object} options - Form options
 * @param {Object} options.initialValues - Initial form values
 * @param {Function} options.validate - Form validation function
 * @param {boolean} options.validateOnChange - Whether to validate on change
 * @param {boolean} options.validateOnBlur - Whether to validate on blur
 * @param {boolean} options.validateOnMount - Whether to validate on mount
 * @param {boolean} options.removeOnUnmount - Whether to remove form state on unmount
 * @returns {Object} Form methods and state
 */
export const useForm = (formId, options = {}) => {
  const {
    initialValues = {},
    validate,
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
    removeOnUnmount = true,
  } = options;
  
  const dispatch = useAppDispatch();
  const values = useAppSelector(state => selectForm(state, formId));
  const errors = useAppSelector(state => selectFormErrors(state, formId));
  const touched = useAppSelector(state => selectFormTouched(state, formId));
  const isSubmitting = useAppSelector(state => selectIsFormSubmitting(state, formId));
  const isSubmitted = useAppSelector(state => selectIsFormSubmitted(state, formId));
  const isDirty = useAppSelector(state => selectIsFormDirty(state, formId));
  const isValid = useAppSelector(state => selectIsFormValid(state, formId));
  
  // Initialize form on mount
  useEffect(() => {
    dispatch(initForm({ formId, initialValues }));
    
    // Validate on mount if enabled
    if (validateOnMount && validate) {
      const validationErrors = validate(initialValues);
      if (validationErrors) {
        dispatch(setFormErrors({ formId, errors: validationErrors }));
      }
    }
    
    // Remove form on unmount if enabled
    return () => {
      if (removeOnUnmount) {
        dispatch(removeForm({ formId }));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  /**
   * Validate form values
   * @param {Object} formValues - Form values to validate
   * @returns {Object} Validation errors
   */
  const validateForm = useCallback((formValues = values) => {
    if (!validate) return {};
    
    const validationErrors = validate(formValues);
    dispatch(setFormErrors({ formId, errors: validationErrors || {} }));
    return validationErrors || {};
  }, [dispatch, formId, validate, values]);
  
  /**
   * Handle field change
   * @param {string} field - Field name
   * @param {*} value - Field value
   */
  const handleChange = useCallback((field, value) => {
    dispatch(updateField({ formId, field, value }));
    
    // Validate on change if enabled
    if (validateOnChange && validate) {
      const newValues = { ...values, [field]: value };
      validateForm(newValues);
    }
  }, [dispatch, formId, validate, validateOnChange, validateForm, values]);
  
  /**
   * Handle field blur
   * @param {string} field - Field name
   */
  const handleBlur = useCallback((field) => {
    dispatch(touchField({ formId, field }));
    
    // Validate on blur if enabled
    if (validateOnBlur && validate) {
      validateForm();
    }
  }, [dispatch, formId, validate, validateOnBlur, validateForm]);
  
  /**
   * Set multiple field values at once
   * @param {Object} newValues - New field values
   */
  const setValues = useCallback((newValues) => {
    dispatch(updateForm({ formId, values: newValues }));
    
    // Validate if enabled
    if (validateOnChange && validate) {
      const updatedValues = { ...values, ...newValues };
      validateForm(updatedValues);
    }
  }, [dispatch, formId, validate, validateOnChange, validateForm, values]);
  
  /**
   * Set a field value
   * @param {string} field - Field name
   * @param {*} value - Field value
   */
  const setValue = useCallback((field, value) => {
    handleChange(field, value);
  }, [handleChange]);
  
  /**
   * Set multiple field errors at once
   * @param {Object} newErrors - New field errors
   */
  const setErrors = useCallback((newErrors) => {
    dispatch(setFormErrors({ formId, errors: newErrors }));
  }, [dispatch, formId]);
  
  /**
   * Set a field error
   * @param {string} field - Field name
   * @param {string} error - Error message
   */
  const setError = useCallback((field, error) => {
    dispatch(setFieldError({ formId, field, error }));
  }, [dispatch, formId]);
  
  /**
   * Clear a field error
   * @param {string} field - Field name
   */
  const clearError = useCallback((field) => {
    dispatch(clearFieldError({ formId, field }));
  }, [dispatch, formId]);
  
  /**
   * Mark a field as touched
   * @param {string} field - Field name
   */
  const setFieldTouched = useCallback((field) => {
    dispatch(touchField({ formId, field }));
  }, [dispatch, formId]);
  
  /**
   * Mark multiple fields as touched
   * @param {Array<string>} fields - Field names
   */
  const setFieldsTouched = useCallback((fields) => {
    dispatch(touchFields({ formId, fields }));
  }, [dispatch, formId]);
  
  /**
   * Mark all fields as touched
   */
  const setAllFieldsTouched = useCallback(() => {
    dispatch(touchAllFields({ formId }));
  }, [dispatch, formId]);
  
  /**
   * Handle form submission
   * @param {Function} onSubmit - Submit handler
   * @returns {Function} Form submit handler
   */
  const handleSubmit = useCallback((onSubmit) => {
    return async (event) => {
      if (event && event.preventDefault) {
        event.preventDefault();
      }
      
      // Mark all fields as touched
      dispatch(touchAllFields({ formId }));
      
      // Validate form
      const validationErrors = validateForm();
      
      // If form is invalid, don't submit
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        return;
      }
      
      // Set submitting state
      dispatch(setFormSubmitting({ formId, isSubmitting: true }));
      
      try {
        // Call submit handler
        await onSubmit(values);
      } finally {
        // Set submitting state
        dispatch(setFormSubmitting({ formId, isSubmitting: false }));
      }
    };
  }, [dispatch, formId, validateForm, values]);
  
  /**
   * Reset form to initial values
   */
  const resetFormValues = useCallback(() => {
    dispatch(resetForm({ formId, initialValues }));
  }, [dispatch, formId, initialValues]);
  
  /**
   * Get field props
   * @param {string} field - Field name
   * @returns {Object} Field props
   */
  const getFieldProps = useCallback((field) => {
    return {
      name: field,
      value: values[field] || '',
      onChange: (e) => handleChange(field, e.target.value),
      onBlur: () => handleBlur(field),
      error: touched[field] && errors[field],
    };
  }, [values, touched, errors, handleChange, handleBlur]);
  
  /**
   * Get form state
   * @returns {Object} Form state
   */
  const formState = useMemo(() => ({
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    isDirty,
    isValid,
  }), [values, errors, touched, isSubmitting, isSubmitted, isDirty, isValid]);
  
  return {
    // Form state
    ...formState,
    
    // Field helpers
    getFieldProps,
    
    // Form methods
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setValue,
    setErrors,
    setError,
    clearError,
    setFieldTouched,
    setFieldsTouched,
    setAllFieldsTouched,
    validateForm,
    resetForm: resetFormValues,
  };
};

export default useForm;
