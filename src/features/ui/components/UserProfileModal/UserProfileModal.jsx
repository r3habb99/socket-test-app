import React, { useEffect, useState } from 'react';
import { Modal, Button, Avatar, Typography, List, Spin } from 'antd';
import {
  CloseOutlined,
  MessageOutlined,
  UserOutlined,
  MailOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../../core/store/hooks';
import { selectUserProfileModal, closeUserProfileModal } from '../../store/uiSlice';
import { getImageUrl } from '../../../../shared/utils';
import { DEFAULT_PROFILE_PIC } from '../../../../constants';
import { getUserById } from '../../../auth/api/authApi';
import './UserProfileModal.css';

const { Text, Title } = Typography;

/**
 * Global User Profile Modal component
 * Uses the UI slice to manage state
 * @returns {JSX.Element} UserProfileModal component
 */
const UserProfileModal = () => {
  const dispatch = useAppDispatch();
  const userProfileState = useAppSelector(selectUserProfileModal);
  const { isOpen, userId } = userProfileState;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await getUserById(userId);
        if (response.error) {
          setError(response.message || 'Failed to load user profile');
        } else {
          // Handle different API response formats
          const userData = response.data || response;
          setUser(userData);
        }
      } catch (err) {
        setError('An error occurred while loading the profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  const handleClose = () => {
    dispatch(closeUserProfileModal());
  };

  // Profile info data for List component
  const getProfileInfoData = (userData) => {
    if (!userData) return [];
    
    return [
      {
        icon: <MailOutlined className="profile-info-icon" />,
        text: userData.email || "No email available"
      },
      {
        icon: <UserOutlined className="profile-info-icon" />,
        text: `User ID: ${userData._id || userData.id || "Unknown"}`
      },
      {
        icon: <ClockCircleOutlined className="profile-info-icon" />,
        text: "Active now"
      }
    ];
  };

  return (
    <Modal
      open={isOpen}
      footer={null}
      closable={false}
      centered
      width={400}
      className="profile-modal"
      maskClassName="profile-modal-mask"
      wrapClassName="profile-modal-wrap"
      onCancel={handleClose}
    >
      {loading ? (
        <div className="profile-loading">
          <Spin size="large" />
          <Text>Loading profile...</Text>
        </div>
      ) : error ? (
        <div className="profile-error">
          <Text type="danger">{error}</Text>
          <Button type="primary" onClick={handleClose}>Close</Button>
        </div>
      ) : user ? (
        <div className="profile-modal-content">
          <div className="profile-modal-header">
            <Title level={4} style={{ margin: 0 }}>Profile</Title>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleClose}
              className="close-button"
            />
          </div>
          
          <div className="profile-user-info">
            <Avatar
              size={64}
              src={user.profilePic ? getImageUrl(user.profilePic, DEFAULT_PROFILE_PIC) : DEFAULT_PROFILE_PIC}
              className="profile-avatar"
            />
            <div className="profile-details">
              <Title level={5} className="profile-name" style={{ margin: '0 0 4px 0' }}>
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username || "User"}
              </Title>
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
          </div>

          <List
            className="profile-info-list"
            itemLayout="horizontal"
            dataSource={getProfileInfoData(user)}
            renderItem={item => (
              <List.Item className="profile-info-item">
                {item.icon}
                <Text>{item.text}</Text>
              </List.Item>
            )}
          />
        </div>
      ) : (
        <div className="profile-not-found">
          <Text>User not found</Text>
          <Button type="primary" onClick={handleClose}>Close</Button>
        </div>
      )}
    </Modal>
  );
};

export default UserProfileModal;
