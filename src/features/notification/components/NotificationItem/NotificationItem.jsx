import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Typography, Space } from "antd";
import {
  UserOutlined,
  HeartOutlined,
  CommentOutlined,
  RetweetOutlined
} from "@ant-design/icons";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import "./NotificationItem.css";

const { Text } = Typography;

/**
 * Get notification icon based on notification type
 * @param {string} type - Notification type
 * @returns {JSX.Element} Icon component
 */
const getNotificationIcon = (type) => {
  switch (type) {
    case "like":
      return <HeartOutlined style={{ color: "#ff4d4f" }} />;
    case "comment":
      return <CommentOutlined style={{ color: "#1890ff" }} />;
    case "retweet":
      return <RetweetOutlined style={{ color: "#52c41a" }} />;
    case "follow":
      return <UserOutlined style={{ color: "#722ed1" }} />;
    default:
      return <UserOutlined />;
  }
};

/**
 * Get notification text based on notification type
 * @param {string} type - Notification type
 * @returns {string} Notification text
 */
const getNotificationText = (type) => {
  switch (type) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "retweet":
      return "retweeted your post";
    case "follow":
      return "started following you";
    default:
      return "interacted with you";
  }
};

/**
 * Get notification link based on notification type and entityId
 * @param {string} type - Notification type
 * @param {string} entityId - Entity ID
 * @returns {string} Link URL
 */
const getNotificationLink = (type, entityId) => {
  switch (type) {
    case "like":
    case "comment":
    case "retweet":
      return `/post/${entityId}`;
    case "follow":
      return `/profile/${entityId}`;
    default:
      return "#";
  }
};

/**
 * NotificationItem component
 * @param {Object} props - Component props
 * @param {Object} props.notification - Notification data
 * @param {Function} props.onMarkAsRead - Function to mark notification as read
 * @param {Function} props.onMarkAsOpened - Function to mark notification as opened
 * @param {number} props.index - Index for staggered animation
 * @returns {JSX.Element} NotificationItem component
 */
const NotificationItem = ({ notification, onMarkAsRead, onMarkAsOpened, index = 0 }) => {
  const { _id, notificationType, userFrom, opened, createdAt, entityId, message } = notification;
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!opened && onMarkAsOpened) {
      onMarkAsOpened(_id);
    }
    if (onMarkAsRead) {
      onMarkAsRead(_id);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Mark as read on hover (desktop only)
    if (!opened && onMarkAsOpened && window.innerWidth > 768) {
      setTimeout(() => {
        onMarkAsOpened(_id);
      }, 1000); // Mark as read after 1 second of hover
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Get full name if available
  const getFullName = () => {
    if (!userFrom) {
      return "A user";
    }

    if (userFrom.firstName && userFrom.lastName) {
      return `${userFrom.firstName} ${userFrom.lastName}`;
    } else if (userFrom.firstName) {
      return userFrom.firstName;
    } else if (userFrom.username) {
      return `@${userFrom.username}`;
    }

    return "A user";
  };

  // Check if notification has required fields
  if (!notification || !_id) {
    return null;
  }

  // Animation variants for staggered entrance
  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        delay: index * 0.05, // Stagger effect
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: 100,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={getNotificationLink(notificationType, entityId)}
        className={`notification-item ${!opened ? "unread" : ""} ${isHovered ? "hovered" : ""}`}
        onClick={handleClick}
      >
        <Badge dot={!opened} offset={[-5, 5]} color="#1d9bf0">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: index * 0.05 + 0.1
            }}
          >
            {userFrom?.profilePic ? (
              <Avatar
                src={userFrom.profilePic}
                className="notification-avatar"
                size={40}
              />
            ) : (
              <Avatar
                icon={getNotificationIcon(notificationType)}
                className="notification-avatar"
                size={40}
              />
            )}
          </motion.div>
        </Badge>
        <div className="notification-content">
          <Space direction="vertical" size={0}>
            <Text strong>
              {message ? (
                message
              ) : (
                <>
                  <span className="notification-username">{getFullName()}</span>{" "}
                  {getNotificationText(notificationType)}
                </>
              )}
            </Text>
            <Text type="secondary" className="notification-time">
              {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : "Unknown time"}
            </Text>
          </Space>
        </div>
      </Link>
    </motion.div>
  );
};

export default NotificationItem;
