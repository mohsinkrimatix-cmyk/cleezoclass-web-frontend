import React, { useEffect, useState, useCallback } from "react";

const API_BASE_URL = "https://cleezoclass.com:4000/api";

const Scanner = () => {
  const [schoolCode, setSchoolCode] = useState("");
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [connectedNumber, setConnectedNumber] = useState("");
  const [authState, setAuthState] = useState("");
  const [lastState, setLastState] = useState("");
  const [lastStateAt, setLastStateAt] = useState("");

  const fetchQr = useCallback(async (code) => {
    if (!code) return;
    console.log("[SCANNER] Fetching QR...", { schoolCode: code });
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/qr?schoolCode=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error || body?.message || "Failed to load QR";
        console.error("[SCANNER] QR fetch failed", { status: res.status, msg });
        throw new Error(msg);
      }
      const data = await res.json();
      console.log("[SCANNER] QR response", data);

      if (data?.ready) {
        console.log("[SCANNER] WhatsApp ready");
        setQr(null);
        setStatus("ready");
        return;
      }

      if (data?.qr) {
        console.log("[SCANNER] QR received");
        setQr(data.qr);
        setStatus("qr");
        return;
      }

      console.log("[SCANNER] Waiting for QR / not ready");
      setStatus("waiting");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Failed to load QR");
    }
  }, []);

  const fetchStatus = useCallback(async (code) => {
    if (!code) return;
    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/status?schoolCode=${encodeURIComponent(code)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ready) {
        setStatus("ready");
        setQr(null);
      }
      if (data?.authenticated && !data?.ready) {
        setStatus("authenticated");
      }
      if (data?.connectedNumber) {
        setConnectedNumber(data.connectedNumber);
      }
      if (data?.authenticated) {
        setAuthState("authenticated");
      }
      if (data?.lastState) {
        setLastState(data.lastState);
      }
      if (data?.lastStateAt) {
        setLastStateAt(data.lastStateAt);
      }
    } catch (e) {
      // ignore status errors
    }
  }, []);

  useEffect(() => {
    const code = localStorage.getItem("schoolCode") || "";
    setSchoolCode(code);
    console.log("[SCANNER] Loaded schoolCode", code);
    if (code) {
      fetchQr(code);
      fetchStatus(code);
    }
  }, [fetchQr, fetchStatus]);

  useEffect(() => {
    if (!schoolCode) return;
    if (status === "ready") return;

    // Poll frequently until ready so the UI updates right after scan
    const interval = setInterval(() => {
      fetchQr(schoolCode);
      fetchStatus(schoolCode);
    }, 50000);

    return () => clearInterval(interval);
  }, [schoolCode, status, fetchQr, fetchStatus]);

  const handleRefresh = () => {
    if (schoolCode) fetchQr(schoolCode);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>WhatsApp Scanner</h2>
      <p style={{ marginTop: 0, color: "#555" }}>
        Scan this QR once to connect WhatsApp for this school.
      </p>

      {!schoolCode && (
        <div style={{ padding: 12, background: "#ffe9e9", borderRadius: 8 }}>
          School code not found. Please login again.
        </div>
      )}

      {schoolCode && (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 280 }}>
            {status === "qr" && qr && (
              <img
                src={qr}
                alt="WhatsApp QR"
                style={{ width: 280, height: 280, border: "1px solid #ddd", borderRadius: 8 }}
              />
            )}

            {status === "loading" && (
              <div style={{ padding: 16, background: "#f6f6f6", borderRadius: 8 }}>
                Loading QR...
              </div>
            )}

            {status === "waiting" && (
              <div style={{ padding: 16, background: "#f6f6f6", borderRadius: 8 }}>
                Waiting for QR...
              </div>
            )}

            {status === "ready" && (
              <div style={{ padding: 16, background: "#e8fff1", borderRadius: 8, border: "1px solid #b7f0c2" }}>
                <strong>WhatsApp Connected</strong>
                <div style={{ marginTop: 6 }}>Status: Ready</div>
                {connectedNumber && (
                  <div style={{ marginTop: 6 }}>Connected Number: {connectedNumber}</div>
                )}
                {!connectedNumber && (
                  <div style={{ marginTop: 6, color: "#556" }}>
                    Connected, but number is not available from WhatsApp.
                  </div>
                )}
              </div>
            )}

            {status === "authenticated" && (
              <div style={{ padding: 16, background: "#fff5d6", borderRadius: 8, border: "1px solid #f2d28b" }}>
                <strong>WhatsApp Authenticated</strong>
                <div style={{ marginTop: 6 }}>Status: Waiting for Ready</div>
              </div>
            )}

            {status === "error" && (
              <div style={{ padding: 16, background: "#ffe9e9", borderRadius: 8 }}>
                {error || "Something went wrong."}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>School Code:</strong> {schoolCode || "-"}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Connected Number:</strong> {connectedNumber || "-"}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Auth State:</strong> {authState || "-"}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Last State:</strong> {lastState || "-"}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Last State At:</strong> {lastStateAt || "-"}
            </div>
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={handleRefresh}
                style={{
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer"
                }}
              >
                Refresh QR
              </button>
            </div>
            <div style={{ color: "#666", fontSize: 14 }}>
              If the QR expires, click Refresh. After you scan once, it should keep working daily unless WhatsApp logs out.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
