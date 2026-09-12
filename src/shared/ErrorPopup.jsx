import React, { useEffect } from "react";
import "../STYLES/ErrorPopup.css";

const ErrorPopup = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const handleClick = () => {
      onClose();
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="error-popup-overlay">
      <div className="error-popup-container">
        <button
          type="button"
          className="error-popup-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close popup"
        >
          ×
        </button>
        <div className="error-popup-message">{message}</div>
      </div>
    </div>
  );
};

export default ErrorPopup;
