import './Input.css';

/**
 * Accessible Input component with ARIA support
 * @param {Object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.name - Input name
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onKeyDown - Key down handler
 * @param {string} props.label - Accessible label (for screen readers)
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether field is required
 */
export const Input = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  onKeyDown,
  label,
  error,
  required = true,
  id,
  ...props
}) => {
  const inputId = id || `input-${name}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <input
      id={inputId}
      className={`input-field ${error ? 'input-field--error' : ''}`}
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      required={required}
      autoComplete="off"
      aria-label={label || placeholder}
      aria-required={required}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={errorId}
      {...props}
    />
  );
};
