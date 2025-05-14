import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../utils/css/toastController.css";

const CloseButton = ({ closeToast }) => (
  <button
    className="toast-close-button"
    onClick={closeToast}
    aria-label="close"
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
            : "toast-default"
        }`
      }
      bodyClassName="toast-body"
      closeButton={<CloseButton />}
      position="top-right"
      autoClose={60000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

export default ToastController;
