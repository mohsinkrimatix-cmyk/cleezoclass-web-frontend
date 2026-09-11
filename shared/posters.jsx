import React, { useEffect, useMemo, useState } from "react";

const ENV_API_BASE = (import.meta.env.VITE_API_BASE || "").trim();
const FALLBACK_BASES = [
  "/api",
  "https://cleezoclass.com:5000/api",
  `${window.location.origin}/api`,
  "https://cleezoclass.com:5000/api",
];

function Posters() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiOrigin, setApiOrigin] = useState("");

  useEffect(() => {
    let alive = true;

    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError("");
        const candidates = [...FALLBACK_BASES, ENV_API_BASE]
          .map((base) => String(base || "").replace(/\/$/, ""))
          .filter(Boolean)
          .filter((base, index, arr) => arr.indexOf(base) === index);

        let resolvedTemplates = [];
        let resolvedBase = "";

        const loadGroup = async (base, endpoint, group) => {
          try {
            const res = await fetch(`${base}${endpoint}`);
            const json = await res.json();
            if (!res.ok || !json?.success || !Array.isArray(json.data)) return [];
            return json.data.map((item) => ({ ...item, group }));
          } catch {
            return [];
          }
        };

        for (const base of candidates) {
          const [welcomeCards, posters] = await Promise.all([
            loadGroup(base, "/welcome-card-templates", "Welcome Card"),
            loadGroup(base, "/poster-templates", "Poster"),
          ]);

          const merged = [...welcomeCards, ...posters];
          if (merged.length > 0) {
            resolvedTemplates = merged;
            resolvedBase = base;
            break;
          }
        }

        if (!resolvedTemplates.length) throw new Error("Failed to fetch welcome cards/posters");
        if (!alive) return;

        setApiOrigin(resolvedBase.replace(/\/api$/, ""));
        setTemplates(resolvedTemplates);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Failed to load templates");
        setTemplates([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadTemplates();
    return () => {
      alive = false;
    };
  }, []);

  const posters = useMemo(
    () =>
      templates.map((item) => ({
        ...item,
        previewUrl: (() => {
          const schoolCode = (localStorage.getItem("schoolCode") || "").trim();
          const params = new URLSearchParams({
            v: String(Date.now()),
          });
          if (schoolCode) params.set("schoolCode", schoolCode);
          params.set("fit", "contain");
          params.set("showMeta", "0");
          if (item.group === "Poster") {
            params.set("cw", "620");
            params.set("ch", "760");
          } else {
            params.set("cw", "600");
            params.set("ch", "600");
          }
          return `${apiOrigin}${item.urlPath}?${params.toString()}`;
        })(),
      })),
    [templates, apiOrigin]
  );

  const getPreviewStyle = (group) => {
    const isPoster = group === "Poster";
    return {
      ...styles.frameWrap,
      ...(isPoster ? styles.frameWrapPoster : styles.frameWrapWelcome),
    };
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>All Welcome Cards and Posters</h2>
      <p style={styles.subText}>Showing welcome card + poster template previews</p>

      {loading && <p style={styles.infoText}>Loading templates...</p>}
      {!loading && error && <p style={styles.errorText}>{error}</p>}

      {!loading && !error && posters.length === 0 && (
        <p style={styles.infoText}>No templates found.</p>
      )}

      {!loading && !error && posters.length > 0 && (
        <div style={styles.grid}>
          {posters.map((item) => (
              <div key={`${item.urlPath}-${item.id}`} style={styles.card}>
                <div style={styles.cardTitle}>
                  <span>{item.name}</span>
                  <span style={styles.badge}>{item.group}</span>
                </div>
                <div style={getPreviewStyle(item.group)}>
                  <iframe
                    title={item.name}
                    src={item.previewUrl}
                    style={styles.frame}
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
                <div style={styles.urlText}>{item.previewUrl}</div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "16px",
  },
  heading: {
    margin: "0 0 6px",
    fontSize: "22px",
  },
  subText: {
    margin: "0 0 14px",
    color: "#5f6772",
  },
  infoText: {
    color: "#394150",
    fontSize: "14px",
  },
  errorText: {
    color: "#b3261e",
    fontWeight: 600,
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(620px, 620px))",
    gap: "14px",
    justifyContent: "center",
  },
  card: {
    width: "620px",
    border: "1px solid #d7dbe2",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  cardTitle: {
    padding: "10px 12px",
    borderBottom: "1px solid #d7dbe2",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "999px",
    border: "1px solid #d7dbe2",
    color: "#374151",
    background: "#f8fafc",
  },
  frameWrap: {
    width: "100%",
    background: "#eef2f7",
    borderBottom: "1px solid #d7dbe2",
    overflow: "hidden",
  },
  frameWrapWelcome: {
    width: "100%",
    height: "600px",
    minHeight: "600px",
    maxHeight: "600px",
  },
  frameWrapPoster: {
    width: "100%",
    height: "760px",
    minHeight: "760px",
    maxHeight: "760px",
  },
  frame: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "#f7f9fc",
  },
  urlText: {
    padding: "8px 10px",
    borderTop: "1px solid #d7dbe2",
    color: "#5f6772",
    fontSize: "11px",
    wordBreak: "break-all",
    background: "#fbfcfe",
  },
};

export default Posters;
