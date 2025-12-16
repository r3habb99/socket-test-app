import { memo } from "react";
import PropTypes from "prop-types";
import "./Skeleton.css";

/**
 * Skeleton component for loading states
 * Provides consistent shimmer animation for content placeholders
 */
const Skeleton = memo(({
  variant = "text",
  width,
  height,
  className = "",
  count = 1,
  circle = false,
  ...rest
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "text":
        return "skeleton--text";
      case "title":
        return "skeleton--title";
      case "avatar":
        return "skeleton--avatar";
      case "thumbnail":
        return "skeleton--thumbnail";
      case "button":
        return "skeleton--button";
      case "card":
        return "skeleton--card";
      default:
        return "";
    }
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
    borderRadius: circle ? "50%" : undefined,
  };

  if (count > 1) {
    return (
      <div className="skeleton-group" role="status" aria-busy="true" aria-label="Loading content">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`skeleton ${getVariantClass()} ${className}`}
            style={style}
            aria-hidden="true"
            {...rest}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${getVariantClass()} ${className}`}
      style={style}
      role="status"
      aria-busy="true"
      aria-label="Loading"
      {...rest}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

Skeleton.displayName = "Skeleton";

Skeleton.propTypes = {
  variant: PropTypes.oneOf(["text", "title", "avatar", "thumbnail", "button", "card"]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  count: PropTypes.number,
  circle: PropTypes.bool,
};

/**
 * PostSkeleton - Skeleton for post cards
 */
export const PostSkeleton = memo(() => (
  <div className="post-skeleton" role="status" aria-busy="true" aria-label="Loading post">
    <div className="post-skeleton__header">
      <Skeleton variant="avatar" />
      <div className="post-skeleton__header-text">
        <Skeleton variant="title" width="120px" />
        <Skeleton variant="text" width="80px" />
      </div>
    </div>
    <div className="post-skeleton__content">
      <Skeleton variant="text" count={3} />
    </div>
    <div className="post-skeleton__actions">
      <Skeleton variant="button" width="60px" />
      <Skeleton variant="button" width="60px" />
      <Skeleton variant="button" width="60px" />
    </div>
    <span className="sr-only">Loading post...</span>
  </div>
));

PostSkeleton.displayName = "PostSkeleton";

/**
 * MessageSkeleton - Skeleton for message items
 */
export const MessageSkeleton = memo(({ isOwn = false }) => (
  <div 
    className={`message-skeleton ${isOwn ? "message-skeleton--own" : ""}`}
    role="status" 
    aria-busy="true"
    aria-label="Loading message"
  >
    {!isOwn && <Skeleton variant="avatar" width="32px" height="32px" />}
    <div className="message-skeleton__content">
      <Skeleton variant="text" width={isOwn ? "150px" : "200px"} />
    </div>
    <span className="sr-only">Loading message...</span>
  </div>
));

MessageSkeleton.displayName = "MessageSkeleton";

/**
 * UserSkeleton - Skeleton for user list items
 */
export const UserSkeleton = memo(() => (
  <div className="user-skeleton" role="status" aria-busy="true" aria-label="Loading user">
    <Skeleton variant="avatar" />
    <div className="user-skeleton__info">
      <Skeleton variant="title" width="100px" />
      <Skeleton variant="text" width="80px" />
    </div>
    <span className="sr-only">Loading user...</span>
  </div>
));

UserSkeleton.displayName = "UserSkeleton";

export default Skeleton;

