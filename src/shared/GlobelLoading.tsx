import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clogo from "../assets/Cleezo Class C logo.png";

export default function GlobalLoader({
  timeoutSeconds = 10,
  showActions = true,
}) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelp(true);
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [timeoutSeconds]);

  const handleLogout =()=>{
     localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  }

  return (
<div className="accountant-dashboard-loader">
  <div className="accountant-dashboard-loader-content">

    <div className="accountant-dashboard-loader-logo-wrap">
      <img
        src={clogo}
        alt="Loading"
        className="accountant-dashboard-loader-logo"
      />
    </div>

 {showHelp && showActions && (
  <div className="accountant-loader-help-panel">
    <h3>Still Working on Your Request</h3>

    <p className="accountant-loader-description">
      We're taking a little longer than usual to retrieve the latest
      information and synchronize your dashboard.
    </p>

    <div className="accountant-loader-info">
      Large datasets, temporary connectivity delays, or ongoing
      background synchronization can occasionally increase loading time.
    </div>

    <div className="accountant-loader-buttons">
      <button
        onClick={() => window.location.reload()}
        className="accountant-loader-btn"
      >
        Refresh Page
      </button>

      <button
        onClick={handleLogout}
        className="accountant-loader-btn accountant-loader-btn-primary"
      >
        Sign In Again
      </button>
    </div>

    <div className="accountant-loader-footer">
      If loading continues for an extended period, refreshing the page
      or signing in again may help restore the connection.
    </div>
  </div>
)}
  </div>
</div>
  );
}