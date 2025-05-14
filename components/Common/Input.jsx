export const Input = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  onKeyDown,
  ...props
}) => {
  return (
    <input
      className="input-field" // This class will inherit styles from global CSS
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      required
      autoComplete="off" // Prevents autofill styling issues
      {...props} // Pass any additional props
    />
  );
};
