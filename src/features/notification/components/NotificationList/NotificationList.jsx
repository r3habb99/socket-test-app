import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  List,
  Typography,
  Button,
  Tabs,
  Empty,
  Spin,
  Layout,
  Badge,
  Divider
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import NotificationItem from "../NotificationItem/NotificationItem";
import {
  getNotifications,
  markNotificationAsOpened,
  markAllNotificationsAsOpened,
} from "../../api";
import "./NotificationList.css";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

/**
 * Group notifications by time period
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Grouped notifications
 */
const groupNotificationsByTime = (notifications) => {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  notifications.forEach(notification => {
    const date = parseISO(notification.createdAt);

    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

/**
 * NotificationList component
 * @returns {JSX.Element} NotificationList component
 */
const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();



  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const unreadOnly = activeTab === "unread";
      const response = await getNotifications(unreadOnly);

      if (response.error) {
        toast.error(response.message || "Failed to load notifications");
        setNotifications([]);
      } else {
        // Extract notifications data from the response
        let notificationsData = [];

        if (Array.isArray(response.data)) {
          notificationsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          notificationsData = response.data.data;
        } else if (response.data?.statusCode && Array.isArray(response.data?.data)) {
          notificationsData = response.data.data;
        }

        // Set notifications state with the extracted data
        setNotifications(notificationsData || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);
  
  // Fetch notifications on component mount and when tab changes
  useEffect(() => {
    fetchNotifications();
  }, [activeTab, fetchNotifications]);



  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await markAllNotificationsAsOpened();

      if (response.error) {
        toast.error(response.message || "Failed to mark all as read");
      } else {
        // Update all notifications in the state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({
            ...notification,
            opened: true
          }))
        );
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as opened
  const handleMarkAsOpened = async (notificationId) => {
    try {
      const response = await markNotificationAsOpened(notificationId);

      if (response.error) {
        console.error("Error marking notification as opened:", response.message);
      } else {
        // Update the notification in the state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, opened: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as opened:", error);
    }
  };

  // Get unread notification count
  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.opened).length;
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Render empty state
  const renderEmpty = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          activeTab === "all"
            ? "No notifications yet"
            : "No unread notifications"
        }
      />
    </motion.div>
  );

  // Render grouped notifications
  const renderGroupedNotifications = (notifications) => {
    const grouped = groupNotificationsByTime(notifications);
    let itemIndex = 0;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {grouped.today.length > 0 && (
            <div className="notification-group">
              <Divider orientation="left">
                <Text strong className="notification-group-title">Today</Text>
              </Divider>
              {grouped.today.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsOpened={handleMarkAsOpened}
                  index={itemIndex++}
                />
              ))}
            </div>
          )}

          {grouped.yesterday.length > 0 && (
            <div className="notification-group">
              <Divider orientation="left">
                <Text strong className="notification-group-title">Yesterday</Text>
              </Divider>
              {grouped.yesterday.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsOpened={handleMarkAsOpened}
                  index={itemIndex++}
                />
              ))}
            </div>
          )}

          {grouped.thisWeek.length > 0 && (
            <div className="notification-group">
              <Divider orientation="left">
                <Text strong className="notification-group-title">This Week</Text>
              </Divider>
              {grouped.thisWeek.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsOpened={handleMarkAsOpened}
                  index={itemIndex++}
                />
              ))}
            </div>
          )}

          {grouped.older.length > 0 && (
            <div className="notification-group">
              <Divider orientation="left">
                <Text strong className="notification-group-title">Older</Text>
              </Divider>
              {grouped.older.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsOpened={handleMarkAsOpened}
                  index={itemIndex++}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <Layout className="notification-list-container">
      <Header className="notification-header">
        <div className="notification-header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/dashboard")}
            className="back-button"
          />
          <Title level={4} className="notification-title">
            Notifications
          </Title>
        </div>
        <div className="notification-header-right">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={fetchNotifications}
            loading={loading}
            className="refresh-button"
          />
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={getUnreadCount() === 0}
            className="mark-all-read-button"
          >
            Mark all as read
          </Button>
        </div>
      </Header>

      <Content className="notification-content">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          className="notification-tabs"
          items={[
            {
              key: "all",
              label: "All",
              children: (
                <div className="notification-list">
                  {loading ? (
                    <motion.div
                      className="notification-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Spin size="large" />
                    </motion.div>
                  ) : notifications.length > 0 ? (
                    renderGroupedNotifications(notifications)
                  ) : (
                    renderEmpty()
                  )}
                </div>
              ),
            },
            {
              key: "unread",
              label: (
                <Badge count={getUnreadCount()} offset={[5, 0]}>
                  <span>Unread</span>
                </Badge>
              ),
              children: (
                <div className="notification-list">
                  {loading ? (
                    <motion.div
                      className="notification-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Spin size="large" />
                    </motion.div>
                  ) : notifications.length > 0 ? (
                    renderGroupedNotifications(notifications)
                  ) : (
                    renderEmpty()
                  )}
                </div>
              ),
            },
          ]}
        />
      </Content>
    </Layout>
  );
};

export default NotificationList;
