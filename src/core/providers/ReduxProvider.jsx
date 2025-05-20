/**
 * Redux Provider Component
 * Combines all providers for easier integration
 */
import React from 'react';
import { Provider } from 'react-redux';
import store from '../store';

/**
 * Redux Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const ReduxProvider = ({ children }) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

export default ReduxProvider;
