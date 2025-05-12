import React from "react";
import { getImageUrl } from "../../../../shared/utils";
import { DEFAULT_PROFILE_PIC } from "../../../../constants";
import { Modal, Avatar, Button, List, Typography } from "antd";
import {
  CloseOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import "./UserProfileModal.css";

export const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  const { Text } = Typography;

  // Profile info data for List component
  const profileInfoData = [
    {
      icon: <MailOutlined className="profile-info-icon" />,
      text: user.email || "No email available"
    },
    {
      icon: <UserOutlined className="profile-info-icon" />,
      text: `User ID: ${user._id || user.id || "Unknown"}`
    },
    {
      icon: <ClockCircleOutlined className="profile-info-icon" />,
      text: "Active now"
    }
  ];

  return (
    <Modal
      open={true}
      footer={null}
      closable={false}
      centered
      width={400}
      className="profile-modal"
      maskClassName="profile-modal-mask"
      wrapClassName="profile-modal-wrap"
      onCancel={onClose}
    >
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <Typography.Title level={4} style={{ margin: 0 }}>Profile</Typography.Title>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="close-button"
          />
        </div>

        <div className="profile-user-info">
          {user.profilePic ? (
            <Avatar
              size={60}
              src={user.profilePic.startsWith("http") ? user.profilePic : getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC)}
              alt={user.username || "User"}
              className="profile-avatar-img"
              onError={(e) => {
                const target = e.target;
                target.src = DEFAULT_PROFILE_PIC;
              }}
            />
          ) : (
            <Avatar
              size={60}
              className="profile-avatar"
            >
              {user.username?.charAt(0).toUpperCase() || "?"}
            </Avatar>
          )}
          <div className="profile-details">
            <Typography.Title level={5} className="profile-name" style={{ margin: '0 0 4px 0' }}>
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username || "User"}
            </Typography.Title>
            <Text type="secondary" className="profile-username">@{user.username || "username"}</Text>
          </div>
        </div>

        <div className="profile-actions">
          <Button
            type="text"
            className="profile-action-button"
            icon={<MessageOutlined />}
          >
            Message
          </Button>
          <Button
            type="text"
            className="profile-action-button"
            icon={<VideoCameraOutlined />}
          >
            Video Call
          </Button>
          <Button
            type="text"
            className="profile-action-button"
            icon={<PhoneOutlined />}
          >
            Voice Call
          </Button>
        </div>

        <List
          className="profile-info-section"
          itemLayout="horizontal"
          dataSource={profileInfoData}
          renderItem={(item) => (
            <List.Item className="profile-info-item">
              {item.icon}
              <Text>{item.text}</Text>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
};
