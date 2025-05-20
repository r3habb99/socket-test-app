import React from 'react';
import { Modal, Button } from 'antd';
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../../core/store/hooks';
import { selectImagePreviewModal, closeImagePreviewModal } from '../../store/uiSlice';
import './ImagePreviewModal.css';

/**
 * Global Image Preview Modal component
 * Uses the UI slice to manage state
 * @returns {JSX.Element} ImagePreviewModal component
 */
const ImagePreviewModal = () => {
  const dispatch = useAppDispatch();
  const imagePreviewState = useAppSelector(selectImagePreviewModal);
  const { isOpen, imageUrl, title } = imagePreviewState;

  const handleClose = () => {
    dispatch(closeImagePreviewModal());
  };

  return (
    <Modal
      open={isOpen}
      title={title || 'Image Preview'}
      footer={null}
      onCancel={handleClose}
      width="90%"
      centered
      className="image-preview-modal"
      closeIcon={<Button type="text" icon={<CloseOutlined />} className="close-modal-button" />}
    >
      <div className="image-preview-container">
        <img
          alt={title || 'Preview'}
          className="preview-image"
          src={imageUrl}
        />
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;
