import { Spin } from "antd";
import "./LoadingFallback.css";

/**
 * Loading fallback component for React.lazy suspense boundaries
 * Provides a consistent loading experience across the app
 */
const LoadingFallback = ({ 
  message = "Loading...",
  fullScreen = false,
  size = "large"
}) => {
  return (
    <div 
      className={`loading-fallback ${fullScreen ? 'loading-fallback--fullscreen' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Spin size={size} />
      <p className="loading-fallback__message">{message}</p>
    </div>
  );
};

export default LoadingFallback;

