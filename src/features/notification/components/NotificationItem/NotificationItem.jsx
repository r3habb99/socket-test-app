import React from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Typography, Space } from "antd";
import {
  UserOutlined,
  HeartOutlined,
  CommentOutlined,
  RetweetOutlined
} from "@ant-design/icons";
import { formatDistanceToNow } from "date-fns";
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
 * @returns {JSX.Element} NotificationItem component
 */
const NotificationItem = ({ notification, onMarkAsRead, onMarkAsOpened }) => {
  const { _id, notificationType, userFrom, opened, createdAt, entityId, message } = notification;

  const handleClick = () => {
    if (!opened && onMarkAsOpened) {
      onMarkAsOpened(_id);
    }
    if (onMarkAsRead) {
      onMarkAsRead(_id);
    }
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

  return (
    <Link
      to={getNotificationLink(notificationType, entityId)}
      className={`notification-item ${!opened ? "unread" : ""}`}
      onClick={handleClick}
    >
      <Badge dot={!opened} offset={[-5, 5]} color="#1d9bf0">
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
  );
};

export default NotificationItem;
