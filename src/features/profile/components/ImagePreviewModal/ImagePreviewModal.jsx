import React from 'react';
import { Modal, Button } from 'antd';
import { FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa';
import './ImagePreviewModal.css';

/**
 * ImagePreviewModal component for displaying profile and cover photos in a larger format
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {string} props.imageUrl - URL of the image to display
 * @param {string} props.imageType - Type of image ('profile' or 'cover')
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @returns {React.ReactElement} Modal component
 */
const ImagePreviewModal = ({ visible, imageUrl, imageType, onClose }) => {
  const title = imageType === 'profile' ? 'Profile photo' : 'Cover photo';
  
  return (
    <Modal
      open={visible}
      title={title}
      footer={null}
      onCancel={onClose}
      width="90%"
      centered
      className="image-preview-modal"
      closeIcon={<Button type="text" icon={<FaTimes />} className="close-modal-button" />}
    >
      <div className="image-preview-container">
        <img
          alt={title}
          className="preview-image"
          src={imageUrl}
        />
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;
