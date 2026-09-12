import React from "react";

const CompactTextTabs = ({ tabs = [], activePath = "", onNavigate }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(tabs.length, 1)}, minmax(0, 1fr))`,
        alignItems: "center",
        gap: "0.28rem",
        marginTop: "0.55rem",
        width: "100%",
      }}
    >
      {tabs.map((tab) => {
        const active = activePath === tab.path;
        return (
          <button
            key={tab.path}
            type="button"
            style={{
              width: "100%",
              padding: 0,
              border: "none",
              background: "transparent",
              color: active ? "#0f172a" : "#475569",
              fontWeight: active ? 800 : 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              minWidth: 0,
              whiteSpace: "nowrap",
              textDecoration: active ? "underline" : "none",
              textUnderlineOffset: "0.18em",
            }}
            onClick={() => onNavigate(tab.path)}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default CompactTextTabs;
