/**
 * Form Slice
 * Manages form state across the application
 */
import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  forms: {},
  formErrors: {},
  formTouched: {},
  formSubmitting: {},
  formSubmitted: {},
  formDirty: {},
};

// Create the slice
const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    // Initialize a form
    initForm: (state, action) => {
      const { formId, initialValues } = action.payload;
      
      // Initialize form state
      state.forms[formId] = initialValues;
      state.formErrors[formId] = {};
      state.formTouched[formId] = {};
      state.formSubmitting[formId] = false;
      state.formSubmitted[formId] = false;
      state.formDirty[formId] = false;
    },
    
    // Update form values
    updateForm: (state, action) => {
      const { formId, values } = action.payload;
      
      // Update form values
      state.forms[formId] = {
        ...state.forms[formId],
        ...values,
      };
      
      // Mark form as dirty
      state.formDirty[formId] = true;
    },
    
    // Update a single form field
    updateField: (state, action) => {
      const { formId, field, value } = action.payload;
      
      // Ensure form exists
      if (!state.forms[formId]) {
        state.forms[formId] = {};
      }
      
      // Update field value
      state.forms[formId][field] = value;
      
      // Mark field as touched
      if (!state.formTouched[formId]) {
        state.formTouched[formId] = {};
      }
      state.formTouched[formId][field] = true;
      
      // Mark form as dirty
      state.formDirty[formId] = true;
    },
    
    // Set form errors
    setFormErrors: (state, action) => {
      const { formId, errors } = action.payload;
      
      // Set form errors
      state.formErrors[formId] = errors;
    },
    
    // Set field error
    setFieldError: (state, action) => {
      const { formId, field, error } = action.payload;
      
      // Ensure form errors exist
      if (!state.formErrors[formId]) {
        state.formErrors[formId] = {};
      }
      
      // Set field error
      state.formErrors[formId][field] = error;
    },
    
    // Clear field error
    clearFieldError: (state, action) => {
      const { formId, field } = action.payload;
      
      // Ensure form errors exist
      if (!state.formErrors[formId]) {
        return;
      }
      
      // Clear field error
      delete state.formErrors[formId][field];
    },
    
    // Mark field as touched
    touchField: (state, action) => {
      const { formId, field } = action.payload;
      
      // Ensure form touched exists
      if (!state.formTouched[formId]) {
        state.formTouched[formId] = {};
      }
      
      // Mark field as touched
      state.formTouched[formId][field] = true;
    },
    
    // Mark multiple fields as touched
    touchFields: (state, action) => {
      const { formId, fields } = action.payload;
      
      // Ensure form touched exists
      if (!state.formTouched[formId]) {
        state.formTouched[formId] = {};
      }
      
      // Mark fields as touched
      fields.forEach(field => {
        state.formTouched[formId][field] = true;
      });
    },
    
    // Mark all fields as touched
    touchAllFields: (state, action) => {
      const { formId } = action.payload;
      
      // Ensure form exists
      if (!state.forms[formId]) {
        return;
      }
      
      // Ensure form touched exists
      if (!state.formTouched[formId]) {
        state.formTouched[formId] = {};
      }
      
      // Mark all fields as touched
      Object.keys(state.forms[formId]).forEach(field => {
        state.formTouched[formId][field] = true;
      });
    },
    
    // Set form submitting state
    setFormSubmitting: (state, action) => {
      const { formId, isSubmitting } = action.payload;
      
      // Set form submitting state
      state.formSubmitting[formId] = isSubmitting;
      
      // If submitting, mark form as submitted
      if (isSubmitting) {
        state.formSubmitted[formId] = true;
      }
    },
    
    // Reset form
    resetForm: (state, action) => {
      const { formId, initialValues } = action.payload;
      
      // Reset form state
      state.forms[formId] = initialValues;
      state.formErrors[formId] = {};
      state.formTouched[formId] = {};
      state.formSubmitting[formId] = false;
      state.formSubmitted[formId] = false;
      state.formDirty[formId] = false;
    },
    
    // Remove form
    removeForm: (state, action) => {
      const { formId } = action.payload;
      
      // Remove form state
      delete state.forms[formId];
      delete state.formErrors[formId];
      delete state.formTouched[formId];
      delete state.formSubmitting[formId];
      delete state.formSubmitted[formId];
      delete state.formDirty[formId];
    },
  },
});

// Export actions
export const {
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
} = formSlice.actions;

// Selectors
export const selectForm = (state, formId) => state.form.forms[formId] || {};
export const selectFormErrors = (state, formId) => state.form.formErrors[formId] || {};
export const selectFormTouched = (state, formId) => state.form.formTouched[formId] || {};
export const selectIsFormSubmitting = (state, formId) => state.form.formSubmitting[formId] || false;
export const selectIsFormSubmitted = (state, formId) => state.form.formSubmitted[formId] || false;
export const selectIsFormDirty = (state, formId) => state.form.formDirty[formId] || false;
export const selectFieldValue = (state, formId, field) => {
  const form = state.form.forms[formId];
  return form ? form[field] : undefined;
};
export const selectFieldError = (state, formId, field) => {
  const errors = state.form.formErrors[formId];
  return errors ? errors[field] : undefined;
};
export const selectIsFieldTouched = (state, formId, field) => {
  const touched = state.form.formTouched[formId];
  return touched ? !!touched[field] : false;
};
export const selectIsFormValid = (state, formId) => {
  const errors = state.form.formErrors[formId] || {};
  return Object.keys(errors).length === 0;
};

// Export reducer
export default formSlice.reducer;
