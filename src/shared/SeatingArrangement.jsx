// SeatingArrangement.js
import React, { useState } from "react";
import TwoButtons from "./SeatingArrangmentClasswise";
import ObjectionCertificate from "./ObjectionCertificate1";

const SeatingArrangement = () => {
  const [activeSection, setActiveSection] = useState("exam");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
       
        background: "linear-gradient(135deg, #eef2f3, #d9e4ec)",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "30px 25px",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          width: "90%",
          maxWidth: "50vw",
          transition: "all 0.3s ease",
        }}
      >
        {activeSection === "exam" && (
          <TwoButtons onLocalNavigate={(next) => setActiveSection(next)} />
        )}
        {activeSection === "examDetails" && <ObjectionCertificate />}
      </div>
    </div>
  );
};

export default SeatingArrangement;
