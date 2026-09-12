import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type CampaignRow = {
  id?: string | number;
  lead_id?: string | number;
  full_name?: string;
  student_name?: string;
  lead_name?: string;
  refer_by?: string;
  date?: string;
  lead_time?: string;
  entry_type?: string;
  campaign_scope?: string;
  mobile_number?: string;
  email_id?: string;
};

type WhatsAppStatus = {
  ready: boolean;
  connectedNumber: string;
  hasClient: boolean;
};

const getSchoolCode = () => {
  const raw = String(localStorage.getItem("schoolCode") || "").trim();
  return raw && raw.toLowerCase() !== "null" && raw.toLowerCase() !== "undefined" ? raw : "";
};

const getLocalDateKey = (value?: string | null) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed.split("T")[0] || "";
  return date.toLocaleDateString("en-CA");
};

const isWithinLastNDays = (value?: string | null, days = 3) => {
  const dateKey = getLocalDateKey(value);
  if (!dateKey) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(from.getDate() - Math.max(0, days - 1));
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= from && parsed <= today;
};

const formatDateTime = (date?: string, time?: string) => {
  const formattedDate = date ? new Date(`${getLocalDateKey(date)}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : "-";
  const formattedTime = time
    ? new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "-";
  return `${formattedDate} ${formattedTime}`;
};

const getDateKeyForOffset = (offsetFromToday: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offsetFromToday);
  return date.toLocaleDateString("en-CA");
};

const getDayLabelForOffset = (offsetFromToday: number) => {
  if (offsetFromToday === 0) return "Today";
  if (offsetFromToday === 1) return "Yesterday";
  return `${offsetFromToday} Days Ago`;
};

const FrontDeskWhatsAppLast3Days: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [status, setStatus] = useState<WhatsAppStatus>({
    ready: false,
    connectedNumber: "",
    hasClient: false,
  });

  const schoolCode = useMemo(() => getSchoolCode(), []);

  const loadData = async () => {
    if (!schoolCode) {
      setError("Missing schoolCode in browser storage.");
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [campaignRes, whatsappRes] = await Promise.all([
        fetch(
          `https://cleezoclass.com:4000/api/frontdesk/campaign-status?schoolCode=${encodeURIComponent(
            schoolCode
          )}&limit=500`
        ),
        fetch(`https://cleezoclass.com:4000/api/whatsapp/status?schoolCode=${encodeURIComponent(schoolCode)}`),
      ]);

      const campaignData = await campaignRes.json().catch(() => ({}));
      const campaignRows = Array.isArray(campaignData?.rows)
        ? campaignData.rows
        : Array.isArray(campaignData)
          ? campaignData
          : [];
      setRows(campaignRows);

      const whatsappData = await whatsappRes.json().catch(() => ({}));
      setStatus({
        ready: Boolean(whatsappData?.ready),
        connectedNumber: String(whatsappData?.connectedNumber || "").trim(),
        hasClient: Boolean(whatsappData?.hasClient),
      });
    } catch (fetchError) {
      setError("Failed to load WhatsApp summary.");
      setRows([]);
      setStatus({
        ready: false,
        connectedNumber: "",
        hasClient: false,
      });
      console.error("FrontDeskWhatsAppLast3Days load failed:", fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => {
      void loadData();
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const last3DaysRows = useMemo(() => rows.filter((row) => isWithinLastNDays(row?.date, 3)), [rows]);

  const whatsappRows = useMemo(
    () =>
      last3DaysRows.filter((row) => {
        const entryType = String(row?.entry_type || "").toLowerCase();
        if (!entryType) return true;
        return !entryType.includes("mail");
      }),
    [last3DaysRows]
  );

  const dailyWhatsAppSummary = useMemo(
    () =>
      [0, 1, 2].map((offset) => {
        const dayKey = getDateKeyForOffset(offset);
        const dayRows = whatsappRows.filter((row) => getLocalDateKey(row?.date) === dayKey);
        const sent = dayRows.length;
        const limit = 30;
        return {
          dayKey,
          label: getDayLabelForOffset(offset),
          dateLabel: new Date(`${dayKey}T00:00:00`).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          sent,
          remaining: Math.max(0, limit - sent),
          overBy: Math.max(0, sent - limit),
        };
      }),
    [whatsappRows]
  );

  const digitalRows = useMemo(
    () => whatsappRows.filter((row) => String(row?.campaign_scope || "").toLowerCase() === "digital"),
    [whatsappRows]
  );

  const staffRows = useMemo(
    () => whatsappRows.filter((row) => String(row?.campaign_scope || "").toLowerCase() === "staff"),
    [whatsappRows]
  );

  const todaySummary = dailyWhatsAppSummary[0] || { sent: 0, remaining: 30 };

  const rangeLabel = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 2);
    return `${from.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} - ${to.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(circle at top left, rgba(32,56,100,0.16), transparent 30%), linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase", color: "#64748b" }}>
              WhatsApp Summary
            </div>
            <h1 style={{ margin: "6px 0 0", fontSize: 30, lineHeight: 1.1 }}>Last 3 Days Sent Count</h1>
            <div style={{ marginTop: 8, color: "#475569" }}>
              School Code: <strong>{schoolCode || "-"}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/FrontDeskCampaigning")}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#0f172a",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            Back to Campaigning
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <div style={cardStyle}>
            <div style={labelStyle}>3-Day WhatsApp Sent</div>
            <div style={valueStyle}>{whatsappRows.length}</div>
            <div style={subtleStyle}>Total from the last 3 days</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Today Sent</div>
            <div style={valueStyle}>{todaySummary.sent}</div>
            <div style={subtleStyle}>Today only</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Today Remaining</div>
            <div style={valueStyle}>{todaySummary.remaining}</div>
            <div style={subtleStyle}>Out of 30 today</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Digital 3-Day</div>
            <div style={valueStyle}>{digitalRows.length}</div>
            <div style={subtleStyle}>Digital campaigns only</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Staff 3-Day</div>
            <div style={valueStyle}>{staffRows.length}</div>
            <div style={subtleStyle}>Staff campaigns only</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>WhatsApp Status</div>
            <div style={valueStyle}>{status.ready ? "Connected" : "Disconnected"}</div>
            <div style={subtleStyle}>{status.connectedNumber || "No connected number found"}</div>
          </div>
        </div>

        <div>
          <div style={{ ...labelStyle, marginBottom: 10 }}>Per Day Breakdown</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {dailyWhatsAppSummary.map((day) => (
              <div key={day.dayKey} style={cardStyle}>
                <div style={labelStyle}>{day.label}</div>
                <div style={{ marginTop: 8, fontWeight: 800, color: "#334155" }}>{day.dateLabel}</div>
                <div style={valueStyle}>{day.sent}</div>
                <div style={subtleStyle}>Sent</div>
                <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  {day.overBy > 0 ? `Over by: ${day.overBy}` : `Remaining: ${day.remaining}`}
                </div>
                <div style={{ ...subtleStyle, marginTop: 6 }}>Daily limit: 30</div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={labelStyle}>Date Range</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{rangeLabel}</div>
            </div>
            <button
              type="button"
              onClick={loadData}
              style={{
                border: "none",
                background: "#203864",
                color: "#fff",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? <div style={mutedLine}>Loading summary...</div> : null}
          {error ? <div style={{ ...mutedLine, color: "#b91c1c" }}>{error}</div> : null}

          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            {whatsappRows.length > 0 ? (
              whatsappRows.map((row, index) => {
                const name = row.full_name || row.student_name || row.lead_name || row.refer_by || "Lead";
                const source = row.campaign_scope || "unknown";
                const isMail = String(row.entry_type || "").toLowerCase().includes("mail");
                const contact = isMail ? row.email_id || "--" : row.mobile_number || "--";
                return (
                  <div key={`${row.id || row.lead_id || index}`} style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{name}</div>
                      <div style={{ color: "#64748b", marginTop: 4 }}>
                        {source} · {contact}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", color: "#334155" }}>
                      <div style={{ fontWeight: 700 }}>{formatDateTime(row.date, row.lead_time)}</div>
                      <div style={{ marginTop: 4, color: "#64748b" }}>
                        {isMail ? "Gmail" : "WhatsApp"}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={mutedLine}>No WhatsApp sends found in the last 3 days.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
  backdropFilter: "blur(8px)",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 22,
  padding: 20,
  boxShadow: "0 16px 42px rgba(15, 23, 42, 0.08)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1.1,
  color: "#64748b",
  fontWeight: 800,
};

const valueStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 34,
  lineHeight: 1,
  fontWeight: 900,
  color: "#0f172a",
};

const subtleStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 13,
};

const mutedLine: React.CSSProperties = {
  color: "#475569",
  fontSize: 14,
};

export default FrontDeskWhatsAppLast3Days;