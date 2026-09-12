import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://cleezoclass.com:4000/api";

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeLabel = (value) => {
  if (!value) return "--";
  const raw = String(value).trim();
  if (!raw) return "--";
  const parts = raw.split(":");
  return `${String(parts[0] || "00").padStart(2, "0")}:${String(parts[1] || "00").padStart(2, "0")}`;
};

function ParentHomepage() {
  const navigate = useNavigate();
  const name = String(localStorage.getItem("name") || "Parent").trim();
  const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
  const username = String(localStorage.getItem("username") || "").trim();

  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const basePath = String(import.meta.env.BASE_URL || "/");
  const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;

  const resolvePosterUrl = (templatePath) => {
    const clean = String(templatePath || "").trim();
    if (!clean) return "";
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith("/")) return clean;
    return `${normalizedBasePath}${clean}`;
  };

  const posterCards = useMemo(
    () =>
      (Array.isArray(posters) ? posters : []).map((item) => {
        const templateId = String(item?.templateId || "").toLowerCase();
        const posterType = templateId.startsWith("birthday") ? "Birthday" : "Event";
        return {
          ...item,
          posterType,
          previewUrl: resolvePosterUrl(item?.templatePath),
        };
      }),
    [posters]
  );

  useEffect(() => {
    if (!schoolCode) {
      setError("School code is missing. Please login again.");
      return;
    }

    let active = true;

    const loadPosters = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          schoolCode,
          limit: "20",
        });
        if (username) params.set("username", username);
        if (name) params.set("studentName", name);

        const response = await fetch(`${API_BASE}/admin-event-posters?${params.toString()}`);
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.message || "Failed to load posters");
        }

        if (!active) return;
        setPosters(Array.isArray(result?.data) ? result.data : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load posters");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPosters();
    const intervalId = window.setInterval(loadPosters, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [schoolCode, username, name]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Parent Homepage</h1>
        <p style={styles.text}>Welcome, {name}</p>
        <p style={styles.text}>School Code: {schoolCode || "N/A"}</p>

        <div style={styles.posterSection}>
          <h2 style={styles.posterHeading}>Received Posters</h2>

          {loading && <p style={styles.mutedText}>Loading posters...</p>}
          {!loading && error && <p style={styles.errorText}>{error}</p>}
          {!loading && !error && posterCards.length === 0 && (
            <p style={styles.mutedText}>No posters received yet.</p>
          )}

          {!loading && !error && posterCards.length > 0 && (
            <div style={styles.posterGrid}>
              {posterCards.map((item) => (
                <div key={item.id} style={styles.posterCard}>
                  <div style={styles.posterMetaTop}>
                    <strong>{item.posterType}</strong>
                    <span>{formatDateLabel(item.eventDate)}</span>
                  </div>

                  {/* ✅ Poster Container */}
                  <div style={styles.posterContainer}>
                    {item.previewUrl ? (
                      <iframe
                        title={`${item.posterType}-${item.id}`}
                        src={item.previewUrl}
                        style={styles.posterFrame}
                      />
                    ) : (
                      <div style={styles.posterPlaceholder}>Preview unavailable</div>
                    )}
                  </div>

                  <div style={styles.posterMetaBottom}>
                    <span>
                      Class {item.className || "-"}-{item.section || "-"}
                    </span>
                    <span>Time {formatTimeLabel(item.eventTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button style={styles.button} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f6f9",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "980px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    padding: "28px",
  },
  title: {
    fontSize: "28px",
    color: "#0a3d62",
  },
  text: {
    fontSize: "16px",
    color: "#333",
  },
  posterSection: {
    marginTop: "18px",
    borderTop: "1px solid #e8edf3",
    paddingTop: "16px",
  },
  posterHeading: {
    fontSize: "20px",
    color: "#0a3d62",
  },
  posterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  posterCard: {
    border: "1px solid #e4eaf1",
    borderRadius: "10px",
    padding: "10px",
    background: "#fafcff",
  },
  posterMetaTop: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    marginBottom: "8px",
  },
  posterMetaBottom: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    marginTop: "8px",
  },

  /* ✅ NEW */
  posterContainer: {
    width: "100%",
    height: "150px",
    overflow: "hidden",
    borderRadius: "8px",
  },

  posterFrame: {
    width: "100%",
    height: "300px", // larger height for scaling
    border: "1px solid #d8e1eb",
    transform: "scale(0.5)", // 🔥 adjust if needed
    transformOrigin: "top left",
  },

  posterPlaceholder: {
    height: "150px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  mutedText: {
    color: "#64748b",
  },
  errorText: {
    color: "red",
  },
  button: {
    marginTop: "18px",
    padding: "12px",
    background: "#0a3d62",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },
};

export default ParentHomepage;