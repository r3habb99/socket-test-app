import React, { useState, useEffect } from "react";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ToastController.css"; // Make sure this file includes the improved CSS

const CloseButton = ({ closeToast }) => (
  <button
    className="toast-close-button"
    onClick={closeToast}
    aria-label="Close toast"
  >
    ×
  </button>
);

const ToastController = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize to detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ToastContainer
      toastClassName={({ type }) =>
        `toast ${
          type === "success"
            ? "toast-success"
            : type === "error"
            ? "toast-error"
            : type === "info"
            ? "toast-info"
            : type === "warning"
            ? "toast-warning"
            : "toast-default"
        }`
      }
      bodyClassName="toast-body"
      closeButton={<CloseButton />}
      position={isMobile ? "top-center" : "top-right"}
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      transition={Bounce}
      limit={isMobile ? 2 : 3}
    />
  );
};

export default ToastController;
