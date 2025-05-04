import React from "react";
import { customToast } from "../../utils";
import { toast, Bounce } from "react-toastify";
import "./ToastTester.css";

/**
 * A simple component to test toast notifications
 */
const ToastTester = () => {
  return (
    <div className="toast-tester">
      <h2>Toast Notification Tester</h2>
      <div className="toast-buttons">
        <button
          className="toast-button success"
          onClick={() => customToast.success("This is a success message!")}
        >
          Success Toast
        </button>

        <button
          className="toast-button error"
          onClick={() => customToast.error("This is an error message!")}
        >
          Error Toast
        </button>

        <button
          className="toast-button info"
          onClick={() => customToast.info("This is an info message!")}
        >
          Info Toast
        </button>

        <button
          className="toast-button warning"
          onClick={() => customToast.warn("This is a warning message!")}
        >
          Warning Toast
        </button>
      </div>

      <h3>With Emojis</h3>
      <div className="toast-buttons">
        <button
          className="toast-button success"
          onClick={() => customToast.success("🎉 Success with emoji!")}
        >
          Success + Emoji
        </button>

        <button
          className="toast-button error"
          onClick={() => customToast.error("❌ Error with emoji!")}
        >
          Error + Emoji
        </button>

        <button
          className="toast-button info"
          onClick={() => customToast.info("ℹ️ Info with emoji!")}
        >
          Info + Emoji
        </button>

        <button
          className="toast-button warning"
          onClick={() => customToast.warn("⚠️ Warning with emoji!")}
        >
          Warning + Emoji
        </button>
      </div>

      <h3>Custom Options</h3>
      <div className="toast-buttons">
        <button
          className="toast-button custom"
          onClick={() =>
            customToast.success("Bottom position toast", {
              position: "bottom-center",
            })
          }
        >
          Bottom Position
        </button>

        <button
          className="toast-button custom"
          onClick={() =>
            customToast.info("Longer duration toast", {
              autoClose: 8000,
            })
          }
        >
          Longer Duration (8s)
        </button>

        <button
          className="toast-button custom"
          onClick={() =>
            customToast.error("No auto close", {
              autoClose: false,
            })
          }
        >
          No Auto Close
        </button>
      </div>

      <h3>Direct React-Toastify API</h3>
      <div className="toast-buttons">
        <button
          className="toast-button direct"
          onClick={() =>
            toast.success("🦄 Direct toast with Bounce!", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
              transition: Bounce,
            })
          }
        >
          Direct API
        </button>
      </div>
    </div>
  );
};

export default ToastTester;
