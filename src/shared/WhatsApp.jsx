import React, { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import connectedAnim from "../assets/1.mov";

const WhatsAppConnect = ({ embedded = false, onConnected } = {}) => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectedAnim, setShowConnectedAnim] = useState(false);
  const [showConnectedText, setShowConnectedText] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const retryTimerRef = useRef(null);

  const schoolCode = localStorage.getItem("schoolCode");
  const API_BASE = import.meta.env.VITE_WHATSAPP_API_BASE || "https://cleezoclass.com:3020";

  const containerStyle = useMemo(() => {
    if (!embedded) return styles.container;
    return {
      width: "fit-content",
      margin: 0,
      textAlign: "center",
      padding: 0,
      borderRadius: 0,
      boxShadow: "none"
    };
  }, [embedded]);

  const loadQR = async () => {
    try {
      if (!schoolCode) {
        setStatus("❌ Missing schoolCode");
        return;
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      const res = await fetch(
        `${API_BASE}/api/whatsapp-qr/${encodeURIComponent(schoolCode)}?t=${Date.now()}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data.qr) {
        // Convert QR string to Data URL
        const qrDataUrl = await QRCode.toDataURL(data.qr);
        setQr(qrDataUrl);
        setIsConnected(false);
        setStatus("Scan QR with WhatsApp");
      } else if (data.ready) {
        setQr(null);
        setIsConnected(true);
        setStatus("Connected");
      } else if (data.success && !data.qr) {
        // Retry if QR not generated yet
        setQr(null);
        setIsConnected(false);
        setStatus("❌ QR not ready, retrying...");
        retryTimerRef.current = setTimeout(loadQR, 2000);
      } else {
        setQr(null);
        setIsConnected(false);
        setStatus("⏳ Waiting for QR...");
        retryTimerRef.current = setTimeout(loadQR, 2000);
      }
    } catch (err) {
      console.error("Error loading QR:", err);
      setIsConnected(false);
      setStatus("❌ Failed to load QR, retrying...");
      retryTimerRef.current = setTimeout(loadQR, 3000);
    }
  };

  const checkStatus = async () => {
    try {
      if (!schoolCode || isResetting) return;
      const res = await fetch(
        `${API_BASE}/api/whatsapp-status/${encodeURIComponent(schoolCode)}?t=${Date.now()}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data.status === "connected") {
        setStatus("Connected");
        setQr(null);
        setIsConnected(true);
      }
    } catch (err) {
      console.error("Status check failed:", err);
    }
  };

  useEffect(() => {
    loadQR();
    const interval = setInterval(checkStatus, 5000);
    return () => {
      clearInterval(interval);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [isResetting, schoolCode]);

  useEffect(() => {
    if (!isConnected) {
      setShowConnectedAnim(false);
      setShowConnectedText(false);
      return;
    }

    if (typeof onConnected === "function") onConnected();

    setShowConnectedAnim(true);
    setShowConnectedText(false);
    const t = setTimeout(() => {
      setShowConnectedAnim(false);
      setShowConnectedText(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [isConnected]);

  const reconnect = async () => {
    try {
      if (!schoolCode) {
        setStatus("❌ Missing schoolCode");
        return;
      }
      setIsResetting(true);
      setStatus("Resetting WhatsApp session...");

      // Backend must implement this route on your WhatsApp bridge server (port 3020)
      const res = await fetch(`${API_BASE}/api/whatsapp-reset/${encodeURIComponent(schoolCode)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Reset failed (HTTP ${res.status})`);
      const body = await res.json();
      if (!body?.success) {
        throw new Error(body?.message || "Reset failed");
      }

      setIsConnected(false);
      setShowConnectedAnim(false);
      setShowConnectedText(false);
      setQr(null);
      setStatus("Scan QR with WhatsApp");
      await loadQR();
    } catch (err) {
      const msg = String(err?.message || err);
      console.error("Reconnect failed:", msg);
      setStatus("❌ Reconnect failed. Backend reset API missing?");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={containerStyle}>
      {!embedded && <h2>Connect WhatsApp</h2>}
      {!isConnected && (
        <div style={{ margin: embedded ? "8px 0 10px 0" : "10px 0 15px 0" }}>
          <img
            src="/whtsapp.gif"
            alt="Connecting"
            style={{ width: 70, height: 70, objectFit: "contain" }}
            onError={(e) => {
              // If gif is missing, avoid broken image icon
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      {showConnectedAnim ? (
        <video
          src={connectedAnim}
          autoPlay
          muted
          playsInline
          style={{ width: embedded ? 170 : 220, height: embedded ? 170 : 220, objectFit: "contain" }}
          onEnded={() => {
            setShowConnectedAnim(false);
            setShowConnectedText(true);
          }}
        />
      ) : qr ? (
        <img
          src={qr}
          alt="WhatsApp QR"
          style={{ width: embedded ? 200 : 250, height: embedded ? 200 : 250 }}
        />
      ) : isConnected && showConnectedText ? (
        <div>
          <p style={{ ...styles.status, fontSize: 12 }}>Connected</p>
          <button
            type="button"
            onClick={reconnect}
            disabled={isResetting}
            style={{
              marginTop: 8,
              background: "#2f3b45",
              color: "#fff",
              border: "none",
              padding: "6px 10px",
              borderRadius: 8,
              cursor: isResetting ? "not-allowed" : "pointer",
              fontWeight: 700,
              opacity: isResetting ? 0.7 : 1,
              fontSize: 12
            }}
          >
            {isResetting ? "Reconnecting..." : "Reconnect"}
          </button>
        </div>
      ) : (
        <p style={{ ...styles.status, fontSize: isConnected ? 12 : 14 }}>{status}</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: 350,
    margin: "100px auto",
    textAlign: "center",
    padding: 30,
    borderRadius: 10,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },
  status: {
    marginTop: 20,
    fontWeight: "bold"
  }
};

export default WhatsAppConnect;
