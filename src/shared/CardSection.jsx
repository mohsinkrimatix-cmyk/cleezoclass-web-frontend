// CARDSECTION.JSX - MODIFIED

import React from "react"; // Removed useState as it is no longer used

// 🟢 MODIFIED: Added rootStyle prop
const CardSection = ({ title, items = [], onItemClick, rootStyle = {} }) => {

  const getItemStyle = (itemTitle) => ({
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: "10px",
    fontSize: "22px",
    borderRadius: "8px",
    padding: "10px",
    transition: "all 0.3s ease",
    cursor: "pointer",
  });

  const circle = (color) => ({
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: color,
    marginRight: "10px",
  });

  const itemContent = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  };

  const smallText = { fontSize: "15px", color: "#666", textAlign: "left" };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        // 🟢 MERGED: Apply the external style (e.g., the border)
        ...rootStyle,
      }}
    >
      <div
        style={{
          fontSize: "28px",
          fontWeight: "600",
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>
      {items.map((i) => (
        <div
          key={i.title}
          style={getItemStyle(i.title)}
          onClick={() => {
            // 🟢 MODIFIED: Use the external handler for both navigation and popup
            onItemClick(i.link); 
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={circle(i.color)}></div>
            <div className="title-hover" style={itemContent}>
              <div style={{ fontWeight: "500" }}>{i.title}</div>
              <div style={smallText}>
                {Array.isArray(i.desc)
                  ? i.desc.map((d, idx) => <div key={idx}>{d}</div>)
                  : i.desc}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardSection;