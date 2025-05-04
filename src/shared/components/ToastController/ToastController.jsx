import React from "react";
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
      position="top-right"
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
      limit={3}
    />
  );
};

export default ToastController;
