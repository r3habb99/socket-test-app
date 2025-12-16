import { Component } from "react";
import PropTypes from "prop-types";
import { Button, Result } from "antd";
import { ReloadOutlined, HomeOutlined } from "@ant-design/icons";
import "./ErrorBoundary.css";

/**
 * ErrorBoundary component for catching and handling React errors
 * Provides a fallback UI when child components throw errors
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/dashboard";
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === "function"
          ? fallback({ error, retry: this.handleRetry })
          : fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <Result
            status="error"
            title="Something went wrong"
            subTitle="We're sorry, but something unexpected happened. Please try again or go back to the home page."
            extra={
              <div className="error-boundary__actions">
                <Button
                  type="primary"
                  icon={<ReloadOutlined aria-hidden="true" />}
                  onClick={this.handleRetry}
                  aria-label="Try again"
                >
                  Try Again
                </Button>
                <Button
                  icon={<HomeOutlined aria-hidden="true" />}
                  onClick={this.handleGoHome}
                  aria-label="Go to home page"
                >
                  Go Home
                </Button>
              </div>
            }
          />
          {showDetails && import.meta.env.DEV && error && (
            <details className="error-boundary__details">
              <summary>Error Details (Development Only)</summary>
              <pre>{error.toString()}</pre>
              {this.state.errorInfo && (
                <pre>{this.state.errorInfo.componentStack}</pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
  onRetry: PropTypes.func,
  showDetails: PropTypes.bool,
};

export default ErrorBoundary;

