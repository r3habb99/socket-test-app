import React from 'react';
import { ImagePreviewModal, UserProfileModal } from '../';

/**
 * GlobalModals component
 * Renders all global modals that are managed by the UI slice
 * @returns {JSX.Element} GlobalModals component
 */
const GlobalModals = () => {
  return (
    <>
      <ImagePreviewModal />
      <UserProfileModal />
    </>
  );
};

export default GlobalModals;
