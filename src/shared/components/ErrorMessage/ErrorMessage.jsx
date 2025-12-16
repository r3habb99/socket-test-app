import { memo } from "react";
import PropTypes from "prop-types";
import { Button, Result } from "antd";
import { ReloadOutlined, HomeOutlined, WarningOutlined } from "@ant-design/icons";
import "./ErrorMessage.css";

/**
 * ErrorMessage component for displaying actionable error states
 * Provides user-friendly error messages with retry functionality
 */
const ErrorMessage = memo(({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  type = "error",
  onRetry,
  onGoHome,
  showRetry = true,
  showHome = false,
  retryText = "Try Again",
  homeText = "Go Home",
  icon,
  className = "",
  compact = false,
}) => {
  const getStatus = () => {
    switch (type) {
      case "warning":
        return "warning";
      case "info":
        return "info";
      case "404":
        return "404";
      case "403":
        return "403";
      case "500":
        return "500";
      default:
        return "error";
    }
  };

  const getDefaultIcon = () => {
    if (icon) return icon;
    if (type === "warning") return <WarningOutlined />;
    return null;
  };

  if (compact) {
    return (
      <div 
        className={`error-message error-message--compact ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="error-message__icon" aria-hidden="true">
          {getDefaultIcon() || <WarningOutlined />}
        </div>
        <div className="error-message__content">
          <p className="error-message__title">{title}</p>
          {message && <p className="error-message__text">{message}</p>}
        </div>
        {showRetry && onRetry && (
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined aria-hidden="true" />}
            onClick={onRetry}
            aria-label={retryText}
          >
            {retryText}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`error-message ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <Result
        status={getStatus()}
        title={title}
        subTitle={message}
        icon={getDefaultIcon()}
        extra={
          <div className="error-message__actions">
            {showRetry && onRetry && (
              <Button
                type="primary"
                icon={<ReloadOutlined aria-hidden="true" />}
                onClick={onRetry}
                aria-label={retryText}
              >
                {retryText}
              </Button>
            )}
            {showHome && onGoHome && (
              <Button
                icon={<HomeOutlined aria-hidden="true" />}
                onClick={onGoHome}
                aria-label={homeText}
              >
                {homeText}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
});

ErrorMessage.displayName = "ErrorMessage";

ErrorMessage.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  type: PropTypes.oneOf(["error", "warning", "info", "404", "403", "500"]),
  onRetry: PropTypes.func,
  onGoHome: PropTypes.func,
  showRetry: PropTypes.bool,
  showHome: PropTypes.bool,
  retryText: PropTypes.string,
  homeText: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
  compact: PropTypes.bool,
};

/**
 * NetworkError - Specialized error for network issues
 */
export const NetworkError = memo(({ onRetry }) => (
  <ErrorMessage
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    type="error"
    onRetry={onRetry}
    showRetry={!!onRetry}
    retryText="Retry Connection"
  />
));

NetworkError.displayName = "NetworkError";
NetworkError.propTypes = { onRetry: PropTypes.func };

/**
 * NotFoundError - Specialized error for 404 states
 */
export const NotFoundError = memo(({ onGoHome, itemName = "page" }) => (
  <ErrorMessage
    title={`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} Not Found`}
    message={`The ${itemName} you're looking for doesn't exist or has been removed.`}
    type="404"
    showRetry={false}
    showHome={!!onGoHome}
    onGoHome={onGoHome}
  />
));

NotFoundError.displayName = "NotFoundError";
NotFoundError.propTypes = { onGoHome: PropTypes.func, itemName: PropTypes.string };

export default ErrorMessage;

