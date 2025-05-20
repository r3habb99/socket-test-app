/**
 * Redux hooks
 * Custom hooks for using Redux in components
 */
import { useDispatch, useSelector } from 'react-redux';

/**
 * Custom hook to access the Redux dispatch function
 * @returns {Function} Redux dispatch function
 */
export const useAppDispatch = () => useDispatch();

/**
 * Custom hook to select data from the Redux store
 * @template TSelected The type of the selected state
 * @param {Function} selector A function that takes the state and returns a value
 * @returns {TSelected} The selected state
 */
export const useAppSelector = useSelector;

/**
 * Custom hook to select and memoize data from the Redux store
 * @template TSelected The type of the selected state
 * @param {Function} selector A function that takes the state and returns a value
 * @returns {TSelected} The memoized selected state
 */
export const useMemoizedSelector = (selector) => {
  // Use useSelector directly, which already has memoization built-in
  return useSelector(selector);
};
