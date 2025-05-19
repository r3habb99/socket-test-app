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
  Badge
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { toast } from "react-toastify";
import NotificationItem from "../NotificationItem/NotificationItem";
import {
  getNotifications,
  markNotificationAsOpened,
  markAllNotificationsAsOpened,
} from "../../api";
import "./NotificationList.css";

const { Title } = Typography;
const { Header, Content } = Layout;

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
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        activeTab === "all"
          ? "No notifications yet"
          : "No unread notifications"
      }
    />
  );

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
                    <div className="notification-loading">
                      <Spin size="large" />
                    </div>
                  ) : notifications.length > 0 ? (
                    <List
                      dataSource={notifications}
                      renderItem={(notification) => (
                        <List.Item className="notification-list-item" key={notification._id}>
                          <NotificationItem
                            notification={notification}
                            onMarkAsOpened={handleMarkAsOpened}
                          />
                        </List.Item>
                      )}
                    />
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
                    <div className="notification-loading">
                      <Spin size="large" />
                    </div>
                  ) : notifications.length > 0 ? (
                    <List
                      dataSource={notifications}
                      renderItem={(notification) => (
                        <List.Item className="notification-list-item" key={notification._id}>
                          <NotificationItem
                            notification={notification}
                            onMarkAsOpened={handleMarkAsOpened}
                          />
                        </List.Item>
                      )}
                    />
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
